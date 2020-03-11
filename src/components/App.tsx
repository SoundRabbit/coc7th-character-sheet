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
    lck: T,
}

type ActiveStatusKind = "str" | "con" | "siz" | "dex" | "app" | "int" | "edu" | "pow" | "lck";

const active_status_order: ActiveStatusKind[] = ["str", "con", "siz", "dex", "app", "int", "edu", "pow", "lck"];

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

    // 初期能力値
    initial_status: ActiveStatus<number>,

    // 変化後能力値
    current_status: ActiveStatus<Unsettled | number>,
    current_hp: Unsettled | number,
    current_san: Unsettled | number,
    current_mp: Unsettled | number,
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
                pow: "3D6*5",
                edu: "(2D6+6)*5",
                lck: "3D6*5",
            },

            initial_status: {
                str: 0,
                con: 0,
                siz: 0,
                dex: 0,
                app: 0,
                int: 0,
                pow: 0,
                edu: 0,
                lck: 0,
            },

            current_status: {
                str: Unsettled,
                con: Unsettled,
                siz: Unsettled,
                dex: Unsettled,
                app: Unsettled,
                int: Unsettled,
                pow: Unsettled,
                edu: Unsettled,
                lck: Unsettled,
            },

            current_hp: Unsettled,
            current_san: Unsettled,
            current_mp: Unsettled,
        }
    }

    roll_all_status() {
        const vars = new Map<string, number>();
        let initial_status = Object.assign({}, this.state.initial_status);
        for (const status_kind of active_status_order) {
            initial_status = Object.assign(initial_status, { [status_kind]: DiceBot.exec(this.state.dice_roll[status_kind], vars) })
        }
        this.setState({
            initial_status
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
                        <Form.Check custom type="checkbox" label="" />,
                        <Form.Control value={this.state.dice_roll[status_kind]} />,
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
            </div>
        );
    }
}