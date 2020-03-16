import * as React from "react"
import { Form, Button } from "react-bootstrap"
import * as firebase from "firebase"
import * as Url from "url-parse"
import * as Uuid from "uuid"
import * as DiceBot from "model/DiceBot"
import * as Decoder from "model/Decoder"

type Props = {
    strage: firebase.storage.Storage
}

const Unsettled = Symbol("Unsettled");
type Unsettled = typeof Unsettled;

export type ActiveStatusOrder = ["str", "con", "siz", "dex", "app", "int", "edu", "pow", "luck"];
export const activeStatusOrder: ActiveStatusOrder = ["str", "con", "siz", "dex", "app", "int", "edu", "pow", "luck"];

type Pop<T extends Array<any>> = ((...a: T) => never) extends ((head: any, ...others: infer Others) => never) ? Others : []
type Tags<T extends Array<any>, Result = T[0]> = {
    "done": Result,
    "continue": Tags<Pop<T>, Result | T[1]>
}[T["length"] extends 1 ? "done" : "continue"];
type Struct<T extends string | number, U> = {
    [P in T]: U
}

export type ActiveStatusTag = Tags<ActiveStatusOrder>;
export type ActiveStatus = Struct<ActiveStatusTag, ActiveStatusProps>;
export type ActiveStatusValue = Struct<ActiveStatusTag, number>;

export type ActiveStatusProps = {
    diceRoll: string,
    locked: boolean,
    initialStatus: number,
    currentStatus: number | null,
}

const ActiveStatusProps = (diceRoll: string) => ({
    diceRoll: diceRoll,
    locked: false,
    initialStatus: 0,
    currentStatus: null,
})

type Skill = {
    tag: "Skill",
    name: symbol | string,
    occupationPoint: number,
    hobbyPoint: number,
    otherPoint: number,
    initialPoint: number | string,
}

type SkillGroupe = {
    tag: "SkillGroupe",
    name: symbol | string,
    skills: Skill[],
}

type Skills = (Skill | SkillGroupe)[];

const Skill = (name: symbol | string, initialPoint: number | string): Skill => ({
    tag: "Skill",
    name: name,
    occupationPoint: 0,
    hobbyPoint: 0,
    otherPoint: 0,
    initialPoint: initialPoint
});

const SkillGroupe = (name: symbol | string, skills: Skill[]): SkillGroupe => ({
    tag: "SkillGroupe",
    name: name,
    skills: skills
})

const defaultSkills = (): Skills => ([
    Skill(Symbol.for("威圧"), 15),
    Skill(Symbol.for("言いくるめ"), 5),
    Skill(Symbol.for("医学"), 1),
    Skill(Symbol.for("運転（自動車）"), 20),
    Skill(Symbol.for("応急手当"), 30),
    Skill(Symbol.for("オカルト"), 5),
    Skill(Symbol.for("隠密"), 20),
    Skill(Symbol.for("回避"), "$DEX/2"),
    SkillGroupe(Symbol.for("科学"), [
        Skill("", 1)
    ]),
    Skill(Symbol.for("鍵開け"), 1),
    Skill(Symbol.for("鑑定"), 5),
    Skill(Symbol.for("機械修理"), 10),
    Skill(Symbol.for("聞き耳"), 20),
    SkillGroupe(Symbol.for("近接戦闘"), [
        Skill(Symbol.for("斧"), 15),
        Skill(Symbol.for("格闘"), 25),
        Skill(Symbol.for("絞殺ひも"), 15),
        Skill(Symbol.for("チェーンソー"), 10),
        Skill(Symbol.for("刀剣"), 20),
        Skill(Symbol.for("フレイル"), 10),
        Skill(Symbol.for("鞭"), 5),
        Skill(Symbol.for("槍"), 20),
    ]),
    Skill(Symbol.for("クトゥルフ神話"), 0),
    SkillGroupe(Symbol.for("芸術/製作"), [
        Skill("", 5)
    ]),
    Skill(Symbol.for("経理"), 5),
    Skill(Symbol.for("考古学"), 1),
    SkillGroupe(Symbol.for("サバイバル"), [
        Skill("", 10)
    ]),
    Skill(Symbol.for("自然"), 10),
    SkillGroupe(Symbol.for("射撃"), [
        Skill(Symbol.for("火炎放射器"), 10),
        Skill(Symbol.for("拳銃"), 20),
        Skill(Symbol.for("サブマシンガン"), 15),
        Skill(Symbol.for("重火器"), 10),
        Skill(Symbol.for("マシンガン"), 10),
        Skill(Symbol.for("弓"), 15),
        Skill(Symbol.for("ライフル/ショットガン"), 25),
    ]),
    Skill(Symbol.for("重機械操作"), 1),
    Skill(Symbol.for("信用"), 0),
    Skill(Symbol.for("心理学"), 10),
    Skill(Symbol.for("人類学"), 1),
    Skill(Symbol.for("水泳"), 20),
    Skill(Symbol.for("精神分析"), 1),
    Skill(Symbol.for("説得"), 10),
    Skill(Symbol.for("操縦"), 1),
    Skill(Symbol.for("跳躍"), 20),
    Skill(Symbol.for("追跡"), 10),
    Skill(Symbol.for("手さばき"), 10),
    Skill(Symbol.for("電気修理"), 10),
    Skill(Symbol.for("投擲"), 20),
    Skill(Symbol.for("登攀"), 20),
    Skill(Symbol.for("図書館"), 20),
    Skill(Symbol.for("ナビゲート"), 10),
    Skill(Symbol.for("変装"), 5),
    Skill(Symbol.for("法律"), 5),
    SkillGroupe(Symbol.for("他言語"), [
        Skill("", 1)
    ]),
    SkillGroupe(Symbol.for("母国語"), [
        Skill("", "$EDU")
    ]),
    Skill(Symbol.for("魅惑"), 15),
    Skill(Symbol.for("目星"), 25),
    Skill(Symbol.for("歴史"), 5),
    SkillGroupe(Symbol.for("追加技能"), [
        Skill("", 0)
    ]),
])

type State = {
    //キャラクタID
    characterId: string,

    // 探索者の基本情報
    name: string,
    occupation: string,
    age: string,
    sex: string,
    residence: string,
    birthplace: string,

    activeStatus: ActiveStatus,
    currentHp: number | null,
    currentSan: number | null,
    currentMp: number | null,

    occupationPoint: string,
    hobbyPoint: string,
    calcSkillPointBasedOnCurrentStatus: boolean,

    skills: Skills
}

type SavableState = { [K in Exclude<keyof State, "characterId">]: State[K] }

const activeStatusPropsDecoder: Decoder.Decoder<ActiveStatusProps> = Decoder.object({
    diceRoll: Decoder.string,
    locked: Decoder.boolean,
    initialStatus: Decoder.number,
    currentStatus: Decoder.nullable(Decoder.number),
});

const activeStatusDecoder: Decoder.Decoder<ActiveStatus> = Decoder.object({
    str: activeStatusPropsDecoder,
    con: activeStatusPropsDecoder,
    siz: activeStatusPropsDecoder,
    dex: activeStatusPropsDecoder,
    app: activeStatusPropsDecoder,
    int: activeStatusPropsDecoder,
    edu: activeStatusPropsDecoder,
    pow: activeStatusPropsDecoder,
    luck: activeStatusPropsDecoder,
});

const skillNameDecoder: Decoder.Decoder<string | symbol> = (x: any): symbol | string => {
    const skills = defaultSkills();
    for (const skill of skills) {
        if (typeof skill.name == "symbol" && Symbol.keyFor(skill.name) == String(x)) {
            return skill.name;
        }
    }
    return String(x);
};

const skillDecoder: Decoder.Decoder<Skill> = Decoder.object({
    tag: Decoder.succeed("Skill"),
    name: skillNameDecoder,
    occupationPoint: Decoder.number,
    hobbyPoint: Decoder.number,
    otherPoint: Decoder.number,
    initialPoint: Decoder.number
});

const skillGroupeDecoder: Decoder.Decoder<SkillGroupe> = Decoder.object({
    tag: Decoder.succeed("SkillGroupe"),
    name: skillNameDecoder,
    skills: Decoder.array(skillDecoder)
});

const savableStateDecoder: Decoder.Decoder<SavableState> = Decoder.object({
    name: Decoder.string,
    occupation: Decoder.string,
    age: Decoder.string,
    sex: Decoder.string,
    residence: Decoder.string,
    birthplace: Decoder.string,
    activeStatus: activeStatusDecoder,
    currentHp: Decoder.nullable(Decoder.number),
    currentSan: Decoder.nullable(Decoder.number),
    currentMp: Decoder.nullable(Decoder.number),
    occupationPoint: Decoder.string,
    hobbyPoint: Decoder.string,
    calcSkillPointBasedOnCurrentStatus: Decoder.boolean,
    skills: Decoder.array(Decoder.tries<Skill | SkillGroupe>([skillDecoder, skillGroupeDecoder]))
});

export class App extends React.Component<Props, State> {
    state: State
    constructor(props: Props) {
        super(props)
        const query = (() => {
            const query = Url(location.href).query;
            if (typeof query == "string") {
                const query_t = (query as string).slice(1).split("&").map(r => r.split("="));
                const res = new Map<string, string | undefined>();
                for (const r of query_t) {
                    res.set(r[0], r[1]);
                }
                return res;
            } else {
                return new Map(Object.entries(query));
            }
        })();
        this.state = {
            characterId: query.get("character-id") || Uuid.v4(),

            name: "",
            occupation: "",
            age: "",
            sex: "",
            residence: "",
            birthplace: "",

            activeStatus: {
                str: ActiveStatusProps("3D6*5"),
                con: ActiveStatusProps("3D6*5"),
                siz: ActiveStatusProps("(2d6+6))*5"),
                dex: ActiveStatusProps("3D6*5"),
                app: ActiveStatusProps("3D6*5"),
                int: ActiveStatusProps("(2d6+6))*5"),
                edu: ActiveStatusProps("(2d6+6))*5"),
                pow: ActiveStatusProps("3D6*5"),
                luck: ActiveStatusProps("3D6*5"),
            },

            currentHp: null,
            currentSan: null,
            currentMp: null,

            occupationPoint: "$EDU*4",
            hobbyPoint: "$INT*2",
            calcSkillPointBasedOnCurrentStatus: false,

            skills: defaultSkills(),
        }

        this.props.strage.ref(`character-sheet/${this.state.characterId}`).getDownloadURL().then(url => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = "text";
            xhr.onload = _ => {
                this.loadFromJson(xhr.response);
            }
            xhr.open("GET", url);
            xhr.send();
        }).catch(_ => { });
    }

    setName(name: string) {
        this.setState({
            name
        });
    }

    setOccupation(occupation: string) {
        this.setState({
            occupation
        });
    }

    setAge(age: string) {
        this.setState({
            age
        });
    }

    setSex(sex: string) {
        this.setState({
            sex
        });
    }

    setResidence(residence: string) {
        this.setState({
            residence
        });
    }

    setBirthplace(birthplace: string) {
        this.setState({
            birthplace
        });
    }

    setCurrentHp(maybeCurrentHp: string) {
        const currentHp = Number(maybeCurrentHp);
        if (!isNaN(currentHp)) {
            this.setState({
                currentHp
            });
        }
    }

    setCurrentMp(maybeCurrentMp: string) {
        const currentMp = Number(maybeCurrentMp);
        if (!isNaN(currentMp)) {
            this.setState({
                currentMp
            });
        }
    }

    setCurrentSan(maybeCurrentSan: string) {
        const currentSan = Number(maybeCurrentSan);
        if (!isNaN(currentSan)) {
            this.setState({
                currentSan
            });
        }
    }

    rollAllStatus() {
        const vars = new Map<string, number>();
        const activeStatus = Object.assign({}, this.state.activeStatus);
        for (const statusKind in activeStatus) {
            const activeStatusProps = activeStatus[statusKind as ActiveStatusTag];
            if (!activeStatusProps.locked) {
                activeStatusProps.initialStatus = DiceBot.exec(activeStatusProps.diceRoll, vars);
            }
        }
        this.setState({
            activeStatus
        });
    }

    resetAllStatus() {
        const activeStatus = Object.assign({}, this.state.activeStatus);
        activeStatus.app.diceRoll = "3D6*5";
        activeStatus.con.diceRoll = "3D6*5";
        activeStatus.dex.diceRoll = "3D6*5";
        activeStatus.edu.diceRoll = "(2D6+6)*5";
        activeStatus.int.diceRoll = "(2D6+6)*5";
        activeStatus.luck.diceRoll = "3D6*5";
        activeStatus.pow.diceRoll = "3D6*5";
        activeStatus.siz.diceRoll = "(2D6+6)*5";
        activeStatus.str.diceRoll = "3D6*5";
        this.setState({
            activeStatus
        });
    }

    setStatusLockedStatus(statusKind: ActiveStatusTag, lockedStatus: boolean) {
        const activeStatus = Object.assign({}, this.state.activeStatus);
        activeStatus[statusKind].locked = lockedStatus;
        this.setState({
            activeStatus
        });
    }

    setStatusDiceRoll(statusKind: ActiveStatusTag, diceRoll: string) {
        if (!this.state.activeStatus[statusKind].locked) {
            const activeStatus = Object.assign({}, this.state.activeStatus);
            activeStatus[statusKind].diceRoll = diceRoll;
            this.setState({
                activeStatus
            });
        }
    }

    setCurrentStatus(statusKind: ActiveStatusTag, maybeStatus: string) {
        const status = Number(maybeStatus);
        if (!isNaN(status)) {
            const activeStatus = Object.assign({}, this.state.activeStatus);
            activeStatus[statusKind].currentStatus = status;
            this.setState({
                activeStatus
            });
        }
    }

    resetCurrentStatus() {
        const activeStatus = Object.assign({}, this.state.activeStatus);
        activeStatus.app.currentStatus = null;
        activeStatus.con.currentStatus = null;
        activeStatus.dex.currentStatus = null;
        activeStatus.edu.currentStatus = null;
        activeStatus.int.currentStatus = null;
        activeStatus.luck.currentStatus = null;
        activeStatus.pow.currentStatus = null;
        activeStatus.siz.currentStatus = null;
        activeStatus.str.currentStatus = null;
        this.setState({
            activeStatus
        });
    }

    setOccupationPoint(occupationPoint: string) {
        this.setState({
            occupationPoint
        });
    }

    setHobbyPoint(hobbyPoint: string) {
        this.setState({
            hobbyPoint
        });
    }

    setCalcSkillPointBasedOnCurrentStatusFlag(calcSkillPointBasedOnCurrentStatus: boolean) {
        this.setState({
            calcSkillPointBasedOnCurrentStatus
        });
    }

    setSkillName(skill: Skill, name: string) {
        const skills = this.state.skills.concat();
        skill.name = name;
        this.setState({
            skills
        });
    }

    setSkillOccupationPoint(skill: Skill, maybePoint: string) {
        const point = Number(maybePoint);
        if (!isNaN(point)) {
            const skills = this.state.skills.concat();
            skill.occupationPoint = point;
            this.setState({
                skills
            });
        }
    }

    setSkillHobbyPoint(skill: Skill, maybePoint: string) {
        const point = Number(maybePoint);
        if (!isNaN(point)) {
            const skills = this.state.skills.concat();
            skill.hobbyPoint = point;
            this.setState({
                skills
            });
        }
    }

    setSkillOtherPoint(skill: Skill, maybePoint: string) {
        const point = Number(maybePoint);
        if (!isNaN(point)) {
            const skills = this.state.skills.concat();
            skill.otherPoint = point;
            this.setState({
                skills
            });
        }
    }

    setSkillInitialPoint(skill: Skill, point: string) {
        const skills = this.state.skills.concat();
        skill.initialPoint = point;
        this.setState({
            skills
        });
    }

    addSkillToSkillGroupe(skillGroupe: SkillGroupe) {
        const skills = this.state.skills.concat();
        skillGroupe.skills.push(Skill("", 0));
        this.setState({
            skills
        });
    }

    removeSkill(parent: Skills | Skill[], skill: Skill) {
        const index = parent.indexOf(skill);
        if (index >= 0) {
            parent.splice(index, 1);
            this.setState({
                skills: this.state.skills.concat()
            });
        }
    }

    loadFromJson(jsonText: string) {
        try {
            const jsonValue = JSON.parse(jsonText);
            this.setState(savableStateDecoder(jsonValue));
        } catch (_) {

        }
    }

    saveToFirebaseStrage(password: string, newPassword: string) {
        // format = "raw" | "base64" | "base64url" | "data_url"
        this.props.strage.ref(`character-sheet/${this.state.characterId}`).putString("", "raw", {
            customMetadata: {
                password,
                newPassword
            }
        });
    }

    render(): JSX.Element | null {
        const activeStatus = this.state.activeStatus;

        const status = {} as ActiveStatusValue;
        for (const tag of activeStatusOrder) {
            const statusProps = activeStatus[tag];
            status[tag] = typeof statusProps.currentStatus == "number" ? statusProps.currentStatus : statusProps.initialStatus;
        }

        const initialHp = Math.ceil((status.con + status.siz) / 10);
        const initialSan = status.pow;
        const initialMp = Math.ceil(status.pow / 5);

        const currentHp = typeof this.state.currentHp == "number" ? this.state.currentHp : initialHp;
        const currentSan = typeof this.state.currentSan == "number" ? this.state.currentSan : initialSan;
        const currentMp = typeof this.state.currentMp == "number" ? this.state.currentMp : initialMp;

        const moverate = (() => {
            if (status.str < status.siz && status.dex < status.siz) {
                return 7;
            } else if (status.str > status.siz && status.dex > status.siz) {
                return 9;
            } else {
                return 8;
            }
        })();
        const damagebonus = (() => {
            if (status.str + status.siz >= 165) {
                return "+1d6";
            } else if (status.str + status.siz >= 125) {
                return "+1d4";
            } else if (status.str + status.siz >= 85) {
                return "0";
            } else if (status.str + status.siz >= 65) {
                return "-1";
            } else {
                return "-2";
            }
        })();

        const initialVars = new Map<string, number>(activeStatusOrder.map(statusKind => [statusKind.toLocaleUpperCase(), activeStatus[statusKind].initialStatus]));
        const currentVars = new Map<string, number>(activeStatusOrder.map(statusKind => [statusKind.toLocaleUpperCase(), status[statusKind]]));
        const maxOccupationPoint = (() => {
            if (this.state.calcSkillPointBasedOnCurrentStatus)
                return Math.ceil(DiceBot.exec(this.state.occupationPoint, currentVars));
            else
                return Math.ceil(DiceBot.exec(this.state.occupationPoint, initialVars));
        })();
        const maxHobbyPoint = (() => {
            if (this.state.calcSkillPointBasedOnCurrentStatus)
                return Math.ceil(DiceBot.exec(this.state.hobbyPoint, currentVars));
            else
                return Math.ceil(DiceBot.exec(this.state.hobbyPoint, initialVars));
        })();

        const digit = (x: number, d: number): string => {
            if (x >= Math.pow(10, d)) {
                return x.toString();
            } else {
                let filler = "";
                for (let i = 0; i < d; i++) {
                    filler += '0';
                }
                return (filler + x).slice(-d);
            }
        }

        const [usedOccupationPoint, usedHobbyPoint] = this.state.skills.reduce((pre, skill) => {
            switch (skill.tag) {
                case "Skill":
                    return [pre[0] + skill.occupationPoint, pre[1] + skill.hobbyPoint];
                case "SkillGroupe":
                    const cur = skill.skills.reduce((pre, skill) => [pre[0] + skill.occupationPoint, pre[1] + skill.hobbyPoint], [0, 0]);
                    return [pre[0] + cur[0], pre[1] + cur[1]];
            }
        }, [0, 0]);

        return (
            <div id="app">
                <div id="profile">
                    <div>PC名</div>
                    <Form.Control value={this.state.name} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setName(e.currentTarget.value)} />
                    <div>職業</div>
                    <Form.Control value={this.state.occupation} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setOccupation(e.currentTarget.value)} />
                    <div>年齢</div>
                    <Form.Control value={this.state.age} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setAge(e.currentTarget.value)} />
                    <div>性別</div>
                    <Form.Control value={this.state.sex} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setSex(e.currentTarget.value)} />
                    <div>住所</div>
                    <Form.Control value={this.state.residence} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setResidence(e.currentTarget.value)} />
                    <div>出身</div>
                    <Form.Control value={this.state.birthplace} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setBirthplace(e.currentTarget.value)} />
                    <div>移動率</div>
                    <Form.Control value={moverate.toString()} disabled />
                    <div>ダメージボーナス</div>
                    <Form.Control value={damagebonus.toString()} disabled />
                    <div>HP</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initialHp.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={currentHp.toString()} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setCurrentHp(e.currentTarget.value)} />
                    </div>
                    <div>MP</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initialMp.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={currentMp.toString()} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setCurrentMp(e.currentTarget.value)} />
                    </div>
                    <div>SAN</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initialSan.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={currentSan.toString()} onInput={(e: React.FormEvent<HTMLInputElement>) => this.setCurrentSan(e.currentTarget.value)} />
                    </div>
                </div>
                <div id="status">
                    <div className="heading">能力</div>
                    <div className="heading">固定</div>
                    <div className="heading">計算方法</div>
                    <div className="heading">初期値</div>
                    <div className="heading">変化後</div>
                    <div className="heading">レギュラー</div>
                    <div className="heading">ハード</div>
                    <div className="heading">イクストリーム</div>

                    {activeStatusOrder.map(tag => {
                        const statusProps = this.state.activeStatus[tag];
                        return [
                            <div>{tag.toLocaleUpperCase()}</div>,
                            <Form.Check
                                custom
                                id={`lock-${tag}`}
                                type="checkbox"
                                label=""
                                checked={statusProps.locked}
                                onClick={() => this.setStatusLockedStatus(tag, !statusProps.locked)}
                            />,
                            <Form.Control
                                as="input"
                                value={statusProps.locked ? statusProps.initialStatus.toString() : statusProps.diceRoll}
                                disabled={statusProps.locked}
                                onInput={(e: React.FormEvent<HTMLInputElement>) => this.setStatusDiceRoll(tag, e.currentTarget.value)}
                            />,
                            <Form.Control value={statusProps.initialStatus.toString()} disabled />,
                            <Form.Control
                                value={status[tag].toString()}
                                onInput={(e: React.FormEvent<HTMLInputElement>) => this.setCurrentStatus(tag, e.currentTarget.value)}
                            />,
                            <Form.Control value={status[tag].toString()} disabled />,
                            <Form.Control value={Math.ceil(status[tag] / 2).toString()} disabled />,
                            <Form.Control value={Math.ceil(status[tag] / 5).toString()} disabled />,
                        ];
                    })}

                    <div className="controller" />
                    <div />
                    <div className="controller">
                        <Button onClick={() => this.rollAllStatus()}>振り直す</Button>
                        <Button variant="danger" onClick={() => this.resetAllStatus()}>リセット</Button>
                    </div>
                    <div className="controller" />
                    <div className="controller">
                        <Button variant="danger" onClick={() => this.resetCurrentStatus()}>リセット</Button>
                    </div>
                    <div className="controller" />
                    <div className="controller" />
                    <div className="controller" />
                </div>
                <div id="skill">
                    <div>
                        <Form.Check
                            custom
                            label="変化後の値をもとに計算"
                            id="calc-point-based-on-current-status"
                            onClick={() => this.setCalcSkillPointBasedOnCurrentStatusFlag(!this.state.calcSkillPointBasedOnCurrentStatus)}
                        />
                    </div>
                    <div className="skill-points">
                        <h5>
                            <span>職業ポイント</span>
                            <span>({digit(usedOccupationPoint, 3)}/{digit(maxOccupationPoint, 3)})</span>
                        </h5>
                        <Form.Control
                            as="input"
                            value={this.state.occupationPoint}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.setOccupationPoint(e.currentTarget.value)}
                        />
                        <h5>
                            <span>趣味ポイント</span>
                            <span>({digit(usedHobbyPoint, 3)}/{digit(maxHobbyPoint, 3)})</span>
                        </h5>
                        <Form.Control
                            as="input"
                            value={this.state.hobbyPoint}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.setHobbyPoint(e.currentTarget.value)}
                        />
                    </div>
                    <div className="skill-list">
                        <div className="heading" />
                        <div className="heading">技能</div>
                        <div className="heading">職業ポイント</div>
                        <div className="heading">趣味ポイント</div>
                        <div className="heading">その他ポイント</div>
                        <div className="heading">初期ポイント</div>
                        <div className="heading">合計</div>
                        <div className="heading">レギュラー</div>
                        <div className="heading">ハード</div>
                        <div className="heading">イクストリーム</div>
                        {this.state.skills.map((item: Skill | SkillGroupe) => {
                            const row = (parent: Skills | Skill[], skill: Skill) => {
                                const skill_name = (() => {
                                    if (typeof skill.name == "symbol")
                                        return Symbol.keyFor(skill.name);
                                    else
                                        return skill.name;
                                })();
                                const initialPoint = (() => {
                                    if (typeof skill.initialPoint == "string")
                                        if (this.state.calcSkillPointBasedOnCurrentStatus)
                                            return Math.ceil(DiceBot.exec(skill.initialPoint, currentVars));
                                        else
                                            return Math.ceil(DiceBot.exec(skill.initialPoint, initialVars));
                                    else
                                        return skill.initialPoint;
                                })();
                                const sum = skill.occupationPoint + skill.hobbyPoint + skill.otherPoint + initialPoint;
                                return [
                                    <div className="row-controller">
                                        <Button variant="danger" disabled={typeof skill.name == "symbol"} onClick={() => this.removeSkill(parent, skill)}>×</Button>
                                    </div>,
                                    <Form.Control
                                        value={skill_name}
                                        disabled={typeof skill.name == "symbol"}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.setSkillName(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.occupationPoint.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.setSkillOccupationPoint(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.hobbyPoint.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.setSkillHobbyPoint(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.otherPoint.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.setSkillOtherPoint(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.initialPoint.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.setSkillInitialPoint(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control value={sum.toString()} disabled />,
                                    <Form.Control value={sum.toString()} disabled />,
                                    <Form.Control value={Math.ceil(sum / 2).toString()} disabled />,
                                    <Form.Control value={Math.ceil(sum / 5).toString()} disabled />
                                ];
                            };
                            switch (item.tag) {
                                case "Skill":
                                    return row(this.state.skills, item);
                                case "SkillGroupe":
                                    const groupe_name = (() => {
                                        if (typeof item.name == "symbol")
                                            return Symbol.keyFor(item.name);
                                        else
                                            return item.name;
                                    })();
                                    return [
                                        <div />,
                                        <Form.Control
                                            className="penetrating-heading"
                                            value={groupe_name}
                                            disabled={typeof item.name == "symbol"}
                                        />,
                                        item.skills.map((skill) => row(item.skills, skill)),
                                        <div />,
                                        <Button variant="primary" onClick={() => this.addSkillToSkillGroupe(item)}>追加</Button>,
                                        <div />,
                                        <div />,
                                        <div />,
                                        <div />,
                                        <div />,
                                        <div />,
                                        <div />,
                                        <div />,
                                    ];
                            }
                        })}
                    </div>
                </div>
            </div>
        );
    }
}