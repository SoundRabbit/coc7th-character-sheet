import * as React from "react"
import { Form, Button } from "react-bootstrap"
import * as firebase from "firebase"
import * as DiceBot from "model/DiceBot"

type Props = {
    strage: firebase.storage.Storage
}

const Unsettled = Symbol("Unsettled");
type Unsettled = typeof Unsettled;

type ActiveStatus<T> = {
    str: T,
    con: T,
    siz: T,
    dex: T,
    app: T,
    int: T,
    edu: T,
    pow: T,
    luck: T,
}

type ActiveStatusKind = "str" | "con" | "siz" | "dex" | "app" | "int" | "edu" | "pow" | "luck";

const active_status_order: ActiveStatusKind[] = ["str", "con", "siz", "dex", "app", "int", "edu", "pow", "luck"];

type Skill = {
    tag: "Skill",
    name: symbol | string,
    occupation_point: number,
    hobby_point: number,
    other_point: number,
    initial_point: number | string,
}

type SkillGroupe = {
    tag: "SkillGroupe",
    name: symbol | string,
    skills: Skill[],
}

type Skills = (Skill | SkillGroupe)[];

const Skill = (name: symbol | string, initial_point: number | string): Skill => ({
    tag: "Skill",
    name: name,
    occupation_point: 0,
    hobby_point: 0,
    other_point: 0,
    initial_point: initial_point
});

const SkillGroupe = (name: symbol | string, skills: Skill[]): SkillGroupe => ({
    tag: "SkillGroupe",
    name: name,
    skills: skills
})

const default_skills = (): Skills => ([
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

const number_from_current_status = (initial_status: number, current_status: Unsettled | number): number => {
    if (current_status == Unsettled) {
        return initial_status;
    } else {
        return current_status;
    }
}

const current_status = (initial_status: ActiveStatus<number>, current_status: ActiveStatus<Unsettled | number>): ActiveStatus<number> => {
    let status = Object.assign({}, initial_status);
    for (const status_kind of active_status_order) {
        const cs = current_status[status_kind];
        if (cs !== Unsettled) {
            initial_status = Object.assign(status, { [status_kind]: cs });
        }
    }
    return status;
}

type State = {
    // 探索者の基本情報
    name: string,
    occupation: string,
    age: string,
    sex: string,
    residence: string,
    birthplace: string,

    //能力値ダイス
    dice_roll: ActiveStatus<string>,

    //出目固定
    locked: ActiveStatus<boolean>,

    // 初期能力値
    initial_status: ActiveStatus<number>,

    // 変化後能力値
    current_status: ActiveStatus<Unsettled | number>,
    current_hp: Unsettled | number,
    current_san: Unsettled | number,
    current_mp: Unsettled | number,

    occupation_point: string,
    hobby_point: string,
    calc_point_based_on_current_status: boolean,

    skills: Skills
}

export class App extends React.Component<Props, State> {
    state: State
    constructor(props: Props) {
        super(props)
        this.state = {
            name: "",
            occupation: "",
            age: "",
            sex: "",
            residence: "",
            birthplace: "",

            dice_roll: {
                str: "3D6*5",
                con: "3D6*5",
                siz: "(2D6+6)*5",
                dex: "3D6*5",
                app: "3D6*5",
                int: "(2D6+6)*5",
                edu: "(2D6+6)*5",
                pow: "3D6*5",
                luck: "3D6*5",
            },

            locked: {
                str: false,
                con: false,
                siz: false,
                dex: false,
                app: false,
                int: false,
                edu: false,
                pow: false,
                luck: false,
            },

            initial_status: {
                str: 0,
                con: 0,
                siz: 0,
                dex: 0,
                app: 0,
                int: 0,
                edu: 0,
                pow: 0,
                luck: 0,
            },

            current_status: {
                str: Unsettled,
                con: Unsettled,
                siz: Unsettled,
                dex: Unsettled,
                app: Unsettled,
                int: Unsettled,
                edu: Unsettled,
                pow: Unsettled,
                luck: Unsettled,
            },

            current_hp: Unsettled,
            current_san: Unsettled,
            current_mp: Unsettled,

            occupation_point: "$EDU*4",
            hobby_point: "$INT*2",
            calc_point_based_on_current_status: false,

            skills: default_skills(),
        }


    }

    set_name(name: string) {
        this.setState({
            name
        });
    }

    set_occupation(occupation: string) {
        this.setState({
            occupation
        });
    }

    set_age(age: string) {
        this.setState({
            age
        });
    }

    set_sex(sex: string) {
        this.setState({
            sex
        });
    }

    set_residence(residence: string) {
        this.setState({
            residence
        });
    }

    set_birthplace(birthplace: string) {
        this.setState({
            birthplace
        });
    }

    set_current_hp(maybe_current_hp: string) {
        const current_hp = Number(maybe_current_hp);
        if (!isNaN(current_hp)) {
            this.setState({
                current_hp
            });
        }
    }

    set_current_mp(maybe_current_mp: string) {
        const current_mp = Number(maybe_current_mp);
        if (!isNaN(current_mp)) {
            this.setState({
                current_mp
            });
        }
    }

    set_current_san(maybe_current_san: string) {
        const current_san = Number(maybe_current_san);
        if (!isNaN(current_san)) {
            this.setState({
                current_san
            });
        }
    }

    roll_all_status() {
        const vars = new Map<string, number>();
        let initial_status = Object.assign({}, this.state.initial_status);
        for (const status_kind of active_status_order) {
            if (!this.state.locked[status_kind]) {
                initial_status = Object.assign(initial_status, { [status_kind]: DiceBot.exec(this.state.dice_roll[status_kind], vars) });
            }
        }
        this.setState({
            initial_status
        });
    }

    reset_all_status() {
        this.setState({
            dice_roll: {
                str: "3D6*5",
                con: "3D6*5",
                siz: "(2D6+6)*5",
                dex: "3D6*5",
                app: "3D6*5",
                int: "(2D6+6)*5",
                edu: "(2D6+6)*5",
                pow: "3D6*5",
                luck: "3D6*5",
            }
        });
    }

    set_status_locked_status(status_kind: ActiveStatusKind, locked_status: boolean) {
        this.setState({
            locked: Object.assign({}, this.state.locked, { [status_kind]: locked_status })
        });
    }

    set_status_dice_roll(status_kind: ActiveStatusKind, dice_roll: string) {
        if (!this.state.locked[status_kind]) {
            this.setState({
                dice_roll: Object.assign({}, this.state.dice_roll, { [status_kind]: dice_roll })
            });
        }
    }

    set_current_status(status_kind: ActiveStatusKind, maybe_status: string) {
        const status = Number(maybe_status);
        if (!isNaN(status)) {
            this.setState({
                current_status: Object.assign({}, this.state.current_status, { [status_kind]: status })
            })
        }
    }

    reset_current_status() {
        this.setState({
            current_status: {
                str: Unsettled,
                con: Unsettled,
                siz: Unsettled,
                dex: Unsettled,
                app: Unsettled,
                int: Unsettled,
                edu: Unsettled,
                pow: Unsettled,
                luck: Unsettled,
            }
        });
    }

    set_occupation_point(occupation_point: string) {
        this.setState({
            occupation_point
        });
    }

    set_hobby_point(hobby_point: string) {
        this.setState({
            hobby_point
        });
    }

    set_calc_point_based_on_current_status_flag(calc_point_based_on_current_status: boolean) {
        this.setState({
            calc_point_based_on_current_status
        });
    }

    set_skill_name(skill: Skill, name: string) {
        const skills = this.state.skills.concat();
        skill.name = name;
        this.setState({
            skills
        });
    }

    set_skill_occupation_point(skill: Skill, maybe_point: string) {
        const point = Number(maybe_point);
        if (!isNaN(point)) {
            const skills = this.state.skills.concat();
            skill.occupation_point = point;
            this.setState({
                skills
            });
        }
    }

    set_skill_hobby_point(skill: Skill, maybe_point: string) {
        const point = Number(maybe_point);
        if (!isNaN(point)) {
            const skills = this.state.skills.concat();
            skill.hobby_point = point;
            this.setState({
                skills
            });
        }
    }

    set_skill_other_point(skill: Skill, maybe_point: string) {
        const point = Number(maybe_point);
        if (!isNaN(point)) {
            const skills = this.state.skills.concat();
            skill.other_point = point;
            this.setState({
                skills
            });
        }
    }

    set_skill_initial_point(skill: Skill, point: string) {
        const skills = this.state.skills.concat();
        skill.initial_point = point;
        this.setState({
            skills
        });
    }

    add_skill_to_skill_groupe(skill_groupe: SkillGroupe) {
        const skills = this.state.skills.concat();
        skill_groupe.skills.push(Skill("", 0));
        this.setState({
            skills
        });
    }

    remove_skill(parent: Skills | Skill[], skill: Skill) {
        const index = parent.indexOf(skill);
        if (index >= 0) {
            parent.splice(index, 1);
            this.setState({
                skills: this.state.skills.concat()
            });
        }
    }

    render(): JSX.Element | null {
        const status = current_status(this.state.initial_status, this.state.current_status);

        const initial_hp = Math.ceil((status.con + status.siz) / 10);
        const initial_san = status.pow;
        const initial_mp = Math.ceil(status.pow / 5);

        const current_hp = number_from_current_status(initial_hp, this.state.current_hp);
        const current_san = number_from_current_status(initial_san, this.state.current_san);
        const current_mp = number_from_current_status(initial_mp, this.state.current_mp);

        const move_rate = (() => {
            if (status.str < status.siz && status.dex < status.siz) {
                return 7;
            } else if (status.str > status.siz && status.dex > status.siz) {
                return 9;
            } else {
                return 8;
            }
        })();
        const damage_bonus = (() => {
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

        const initial_vars = new Map<string, number>(active_status_order.map(status_kind => [status_kind.toLocaleUpperCase(), this.state.initial_status[status_kind]]));
        const current_vars = new Map<string, number>(active_status_order.map(status_kind => [status_kind.toLocaleUpperCase(), status[status_kind]]));
        const max_occupation_point = (() => {
            if (this.state.calc_point_based_on_current_status)
                return Math.ceil(DiceBot.exec(this.state.occupation_point, current_vars));
            else
                return Math.ceil(DiceBot.exec(this.state.occupation_point, initial_vars));
        })();
        const max_hobby_point = (() => {
            if (this.state.calc_point_based_on_current_status)
                return Math.ceil(DiceBot.exec(this.state.hobby_point, current_vars));
            else
                return Math.ceil(DiceBot.exec(this.state.hobby_point, initial_vars));
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

        const [used_occupation_point, used_hobby_point] = this.state.skills.reduce((pre, skill) => {
            switch (skill.tag) {
                case "Skill":
                    return [pre[0] + skill.occupation_point, pre[1] + skill.hobby_point];
                case "SkillGroupe":
                    const cur = skill.skills.reduce((pre, skill) => [pre[0] + skill.occupation_point, pre[1] + skill.hobby_point], [0, 0]);
                    return [pre[0] + cur[0], pre[1] + cur[1]];
            }
        }, [0, 0]);

        return (
            <div id="app">
                <div id="profile">
                    <div>PC名</div>
                    <Form.Control value={this.state.name} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_name(e.currentTarget.value)} />
                    <div>職業</div>
                    <Form.Control value={this.state.occupation} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_occupation(e.currentTarget.value)} />
                    <div>年齢</div>
                    <Form.Control value={this.state.age} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_age(e.currentTarget.value)} />
                    <div>性別</div>
                    <Form.Control value={this.state.sex} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_sex(e.currentTarget.value)} />
                    <div>住所</div>
                    <Form.Control value={this.state.residence} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_residence(e.currentTarget.value)} />
                    <div>出身</div>
                    <Form.Control value={this.state.birthplace} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_birthplace(e.currentTarget.value)} />
                    <div>移動率</div>
                    <Form.Control value={move_rate.toString()} disabled />
                    <div>ダメージボーナス</div>
                    <Form.Control value={damage_bonus} disabled />
                    <div>HP</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initial_hp.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={current_hp.toString()} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_current_hp(e.currentTarget.value)} />
                    </div>
                    <div>MP</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initial_mp.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={current_mp.toString()} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_current_mp(e.currentTarget.value)} />
                    </div>
                    <div>SAN</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initial_san.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={current_san.toString()} onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_current_san(e.currentTarget.value)} />
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

                    {active_status_order.map(status_kind => [
                        <div>{status_kind.toLocaleUpperCase()}</div>,
                        <Form.Check
                            custom
                            id={`lock-${status_kind}`}
                            type="checkbox"
                            label=""
                            checked={this.state.locked[status_kind]}
                            onClick={() => this.set_status_locked_status(status_kind, !this.state.locked[status_kind])}
                        />,
                        <Form.Control
                            as="input"
                            value={
                                this.state.locked[status_kind] ?
                                    this.state.initial_status[status_kind].toString() :
                                    this.state.dice_roll[status_kind]
                            }
                            disabled={this.state.locked[status_kind]}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_status_dice_roll(status_kind, e.currentTarget.value)}
                        />,
                        <Form.Control value={this.state.initial_status[status_kind].toString()} disabled />,
                        <Form.Control
                            value={status[status_kind].toString()}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_current_status(status_kind, e.currentTarget.value)}
                        />,
                        <Form.Control value={status[status_kind].toString()} disabled />,
                        <Form.Control value={Math.ceil(status[status_kind] / 2).toString()} disabled />,
                        <Form.Control value={Math.ceil(status[status_kind] / 5).toString()} disabled />,
                    ])}

                    <div className="controller" />
                    <div />
                    <div className="controller">
                        <Button onClick={() => this.roll_all_status()}>振り直す</Button>
                        <Button variant="danger" onClick={() => this.reset_all_status()}>リセット</Button>
                    </div>
                    <div className="controller" />
                    <div className="controller">
                        <Button variant="danger" onClick={() => this.reset_current_status()}>リセット</Button>
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
                            onClick={() => this.set_calc_point_based_on_current_status_flag(!this.state.calc_point_based_on_current_status)}
                        />
                    </div>
                    <div className="skill-points">
                        <h5>
                            <span>職業ポイント</span>
                            <span>({digit(used_occupation_point, 3)}/{digit(max_occupation_point, 3)})</span>
                        </h5>
                        <Form.Control
                            as="input"
                            value={this.state.occupation_point}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_occupation_point(e.currentTarget.value)}
                        />
                        <h5>
                            <span>趣味ポイント</span>
                            <span>({digit(used_hobby_point, 3)}/{digit(max_hobby_point, 3)})</span>
                        </h5>
                        <Form.Control
                            as="input"
                            value={this.state.hobby_point}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_hobby_point(e.currentTarget.value)}
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
                                const initial_point = (() => {
                                    if (typeof skill.initial_point == "string")
                                        if (this.state.calc_point_based_on_current_status)
                                            return Math.ceil(DiceBot.exec(skill.initial_point, current_vars));
                                        else
                                            return Math.ceil(DiceBot.exec(skill.initial_point, initial_vars));
                                    else
                                        return skill.initial_point;
                                })();
                                const sum = skill.occupation_point + skill.hobby_point + skill.other_point + initial_point;
                                return [
                                    <div className="row-controller">
                                        <Button variant="danger" disabled={typeof skill.name == "symbol"} onClick={() => this.remove_skill(parent, skill)}>×</Button>
                                    </div>,
                                    <Form.Control
                                        value={skill_name}
                                        disabled={typeof skill.name == "symbol"}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_skill_name(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.occupation_point.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_skill_occupation_point(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.hobby_point.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_skill_hobby_point(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.other_point.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_skill_other_point(skill, e.currentTarget.value)}
                                    />,
                                    <Form.Control
                                        value={skill.initial_point.toString()}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_skill_initial_point(skill, e.currentTarget.value)}
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
                                        <Button variant="primary" onClick={() => this.add_skill_to_skill_groupe(item)}>追加</Button>,
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