import * as React from "react"
import { Form, Button } from "react-bootstrap"
import * as DiceBot from "model/DiceBot"

type Props = {}

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

    render(): JSX.Element | null {
        const status = current_status(this.state.initial_status, this.state.current_status);

        const initial_hp = Math.ceil((status.con + status.siz) / 10);
        const initial_san = status.pow;
        const initial_mp = Math.ceil(status.pow / 5);

        const current_hp = number_from_current_status(initial_hp, this.state.current_hp);
        const current_san = number_from_current_status(initial_san, this.state.current_san);
        const current_mp = number_from_current_status(initial_mp, this.state.current_mp);

        const movement = (() => {
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

        const vars = new Map<string, number>(active_status_order.map(status_kind => [status_kind.toLocaleUpperCase(), status[status_kind]]));
        const max_occupation_point = Math.ceil(DiceBot.exec(this.state.occupation_point, vars));
        const max_hobby_point = Math.ceil(DiceBot.exec(this.state.hobby_point, vars));

        console.log(vars.entries());

        return (
            <div id="app">
                <div id="profile">
                    <div>PC名</div>
                    <Form.Control value={this.state.name} />
                    <div>職業</div>
                    <Form.Control value={this.state.occupation} />
                    <div>年齢</div>
                    <Form.Control value={this.state.age} />
                    <div>性別</div>
                    <Form.Control value={this.state.sex} />
                    <div>住所</div>
                    <Form.Control value={this.state.residence} />
                    <div>出身</div>
                    <Form.Control value={this.state.birthplace} />
                    <div>移動率</div>
                    <Form.Control value={movement.toString()} disabled />
                    <div>ダメージボーナス</div>
                    <Form.Control value={damage_bonus} disabled />
                    <div>HP</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initial_hp.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={current_hp.toString()} />
                    </div>
                    <div>MP</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initial_mp.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={current_mp.toString()} />
                    </div>
                    <div>SAN</div>
                    <div>
                        <div>初期値</div>
                        <Form.Control value={initial_san.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={current_san.toString()} />
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
                        <Form.Control value={status[status_kind].toString()} />,
                        <Form.Control value={status[status_kind].toString()} disabled />,
                        <Form.Control value={Math.ceil(status[status_kind] / 2).toString()} disabled />,
                        <Form.Control value={Math.ceil(status[status_kind] / 5).toString()} disabled />,
                    ])}

                    <div className="controller" />
                    <div />
                    <div className="controller">
                        <Button onClick={() => this.roll_all_status()}>振り直す</Button>
                        <Button variant="danger">リセット</Button>
                    </div>
                    <div className="controller" />
                    <div className="controller">
                        <Button variant="danger">リセット</Button>
                    </div>
                    <div className="controller" />
                    <div className="controller" />
                    <div className="controller" />
                </div>
                <div id="skill">
                    <div className="skill-points">
                        <div>
                            <div>職業ポイント</div>
                            <div>
                                <span>（</span>
                                <span></span>
                                <span>/</span>
                                <span>
                                    {(() => {
                                        if (max_occupation_point >= 1000) {
                                            return max_occupation_point.toString();
                                        } else {
                                            return ("000" + max_occupation_point).slice(-3);
                                        }
                                    })()}
                                </span>
                                <span>）</span>
                            </div>
                        </div>
                        <Form.Control
                            as="input"
                            value={this.state.occupation_point}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_occupation_point(e.currentTarget.value)}
                        />
                        <div>
                            <div>趣味ポイント</div>
                            <div>
                                <span>（</span>
                                <span></span>
                                <span>/</span>
                                <span>
                                    {(() => {
                                        if (max_hobby_point >= 1000) {
                                            return max_hobby_point.toString();
                                        } else {
                                            return ("000" + max_hobby_point).slice(-3);
                                        }
                                    })()}
                                </span>
                                <span>）</span>
                            </div>
                        </div>
                        <Form.Control
                            as="input"
                            value={this.state.hobby_point}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_hobby_point(e.currentTarget.value)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}