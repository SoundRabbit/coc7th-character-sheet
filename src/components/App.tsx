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
    calc_occupation_point_based_on_current_status: boolean,
    calc_hobby_point_based_on_current_status: boolean,
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
            calc_occupation_point_based_on_current_status: false,
            calc_hobby_point_based_on_current_status: false,
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

    set_calc_occupation_point_based_on_current_status_flag(calc_occupation_point_based_on_current_status: boolean) {
        this.setState({
            calc_occupation_point_based_on_current_status
        });
    }

    set_calc_hobby_point_based_on_current_status_flag(calc_hobby_point_based_on_current_status: boolean) {
        this.setState({
            calc_hobby_point_based_on_current_status
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
            if (this.state.calc_occupation_point_based_on_current_status)
                return Math.ceil(DiceBot.exec(this.state.occupation_point, current_vars));
            else
                return Math.ceil(DiceBot.exec(this.state.occupation_point, initial_vars));
        })();
        const max_hobby_point = (() => {
            if (this.state.calc_hobby_point_based_on_current_status)
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
                    <div className="skill-points">
                        <h5>
                            <span>職業ポイント</span>
                            <span>(/{digit(max_occupation_point, 3)})</span>
                        </h5>
                        <Form.Control
                            as="input"
                            value={this.state.occupation_point}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_occupation_point(e.currentTarget.value)}
                        />
                        <Form.Check
                            custom
                            label="変化後の値をもとに計算"
                            id="calc-occupation-point-based-on-current-status"
                            onClick={() => this.set_calc_occupation_point_based_on_current_status_flag(!this.state.calc_occupation_point_based_on_current_status)}
                        />
                        <h5>
                            <span>趣味ポイント</span>
                            <span>(/{digit(max_hobby_point, 3)})</span>
                        </h5>
                        <Form.Control
                            as="input"
                            value={this.state.hobby_point}
                            onInput={(e: React.FormEvent<HTMLInputElement>) => this.set_hobby_point(e.currentTarget.value)}
                        />
                        <Form.Check
                            custom
                            label="変化後の値をもとに計算"
                            id="calc-hobby-point-based-on-current-status"
                            onClick={() => this.set_calc_hobby_point_based_on_current_status_flag(!this.state.calc_hobby_point_based_on_current_status)}
                        />
                    </div>
                </div>
            </div>
        );
    }
}