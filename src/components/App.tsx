import * as React from "react"
import { Form, Button } from "react-bootstrap"
import * as DiceBot from "model/DiceBot"

type Props = {}

const Unsettled = Symbol("Unsettled");
type Unsettled = typeof Unsettled;

const number_from_current_status = (initial_status: number, current_status: Unsettled | number): number => {
    if (current_status == Unsettled) {
        return initial_status;
    } else {
        return current_status;
    }
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
    dice_str: string,
    dice_con: string,
    dice_siz: string,
    dice_dex: string,
    dice_app: string,
    dice_int: string,
    dice_pow: string,
    dice_edu: string,
    dice_luck: string,

    // 初期能力値
    initial_str: number,
    initial_con: number,
    initial_siz: number,
    initial_dex: number,
    initial_app: number,
    initial_int: number,
    initial_pow: number,
    initial_edu: number,
    initial_luck: number,

    // 変化後能力値
    current_str: Unsettled | number,
    current_con: Unsettled | number,
    current_siz: Unsettled | number,
    current_dex: Unsettled | number,
    current_app: Unsettled | number,
    current_int: Unsettled | number,
    current_pow: Unsettled | number,
    current_edu: Unsettled | number,
    current_hp: Unsettled | number,
    current_san: Unsettled | number,
    current_mp: Unsettled | number,
    current_luck: Unsettled | number,
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

            dice_str: "3D6*5",
            dice_con: "3D6*5",
            dice_siz: "(2D6+6)*5",
            dice_dex: "3D6*5",
            dice_app: "3D6*5",
            dice_int: "(2D6+6)*5",
            dice_pow: "3D6*5",
            dice_edu: "(2D6+6)*5",
            dice_luck: "3D6*5",

            initial_str: 0,
            initial_con: 0,
            initial_siz: 0,
            initial_dex: 0,
            initial_app: 0,
            initial_int: 0,
            initial_pow: 0,
            initial_edu: 0,
            initial_luck: 0,

            current_str: Unsettled,
            current_con: Unsettled,
            current_siz: Unsettled,
            current_dex: Unsettled,
            current_app: Unsettled,
            current_int: Unsettled,
            current_pow: Unsettled,
            current_edu: Unsettled,
            current_hp: Unsettled,
            current_san: Unsettled,
            current_mp: Unsettled,
            current_luck: Unsettled,
        }
    }

    roll_all_status() {
        const vars = new Map<string, number>();
        this.setState({
            initial_str: DiceBot.exec(this.state.dice_str, vars),
            initial_con: DiceBot.exec(this.state.dice_con, vars),
            initial_siz: DiceBot.exec(this.state.dice_siz, vars),
            initial_dex: DiceBot.exec(this.state.dice_dex, vars),
            initial_app: DiceBot.exec(this.state.dice_app, vars),
            initial_int: DiceBot.exec(this.state.dice_int, vars),
            initial_pow: DiceBot.exec(this.state.dice_pow, vars),
            initial_edu: DiceBot.exec(this.state.dice_edu, vars),
            initial_luck: DiceBot.exec(this.state.dice_luck, vars),
        })
    }

    render(): JSX.Element | null {
        const current_str = number_from_current_status(this.state.initial_str, this.state.current_str);
        const current_con = number_from_current_status(this.state.initial_con, this.state.current_con);
        const current_siz = number_from_current_status(this.state.initial_siz, this.state.current_siz);
        const current_dex = number_from_current_status(this.state.initial_dex, this.state.current_dex);
        const current_app = number_from_current_status(this.state.initial_app, this.state.current_app);
        const current_int = number_from_current_status(this.state.initial_int, this.state.current_int);
        const current_pow = number_from_current_status(this.state.initial_pow, this.state.current_pow);
        const current_edu = number_from_current_status(this.state.initial_edu, this.state.current_edu);
        const current_luck = number_from_current_status(this.state.initial_luck, this.state.current_luck);

        const initial_hp = Math.ceil((current_con + current_siz) / 10);
        const initial_san = current_pow;
        const initial_mp = Math.ceil(current_pow / 5);

        const current_hp = number_from_current_status(initial_hp, this.state.current_hp);
        const current_san = number_from_current_status(initial_san, this.state.current_san);
        const current_mp = number_from_current_status(initial_mp, this.state.current_mp);

        const movement = (() => {
            if (current_str < current_siz && current_dex < current_siz) {
                return 7;
            } else if (current_str == current_siz && current_dex == current_siz) {
                return 8;
            } else {
                return 9;
            }
        })();
        const damage_bonus = (() => {
            if (current_siz + current_siz >= 165) {
                return "+1d6";
            } else if (current_siz + current_siz >= 125) {
                return "+1d4";
            } else if (current_siz + current_siz >= 85) {
                return "0";
            } else if (current_siz + current_siz >= 65) {
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
                        <Form.Control value={initial_hp.toString()} disabled />
                        <div>変化後</div>
                        <Form.Control value={current_hp.toString()} />
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
                    <div className="heading">ダイス</div>
                    <div className="heading">初期値</div>
                    <div className="heading">変化後</div>
                    <div className="heading">レギュラー</div>
                    <div className="heading">ハード</div>
                    <div className="heading">イクストリーム</div>

                    <div>STR</div>
                    <Form.Control value={this.state.dice_str} />
                    <Form.Control value={this.state.initial_str.toString()} disabled />
                    <Form.Control value={current_str.toString()} />
                    <Form.Control value={current_str.toString()} disabled />
                    <Form.Control value={Math.ceil(current_str / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_str / 5).toString()} disabled />

                    <div>CON</div>
                    <Form.Control value={this.state.dice_con} />
                    <Form.Control value={this.state.initial_con.toString()} disabled />
                    <Form.Control value={current_con.toString()} />
                    <Form.Control value={current_con.toString()} disabled />
                    <Form.Control value={Math.ceil(current_con / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_con / 5).toString()} disabled />

                    <div>SIZ</div>
                    <Form.Control value={this.state.dice_siz} />
                    <Form.Control value={this.state.initial_siz.toString()} disabled />
                    <Form.Control value={current_siz.toString()} />
                    <Form.Control value={current_siz.toString()} disabled />
                    <Form.Control value={Math.ceil(current_siz / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_siz / 5).toString()} disabled />

                    <div>DEX</div>
                    <Form.Control value={this.state.dice_dex} />
                    <Form.Control value={this.state.initial_dex.toString()} disabled />
                    <Form.Control value={current_dex.toString()} />
                    <Form.Control value={current_dex.toString()} disabled />
                    <Form.Control value={Math.ceil(current_dex / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_dex / 5).toString()} disabled />

                    <div>APP</div>
                    <Form.Control value={this.state.dice_app} />
                    <Form.Control value={this.state.initial_app.toString()} disabled />
                    <Form.Control value={current_app.toString()} />
                    <Form.Control value={current_app.toString()} disabled />
                    <Form.Control value={Math.ceil(current_app / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_app / 5).toString()} disabled />

                    <div>INT</div>
                    <Form.Control value={this.state.dice_int} />
                    <Form.Control value={this.state.initial_int.toString()} disabled />
                    <Form.Control value={current_int.toString()} />
                    <Form.Control value={current_int.toString()} disabled />
                    <Form.Control value={Math.ceil(current_int / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_int / 5).toString()} disabled />

                    <div>EDU</div>
                    <Form.Control value={this.state.dice_edu} />
                    <Form.Control value={this.state.initial_edu.toString()} disabled />
                    <Form.Control value={current_edu.toString()} />
                    <Form.Control value={current_edu.toString()} disabled />
                    <Form.Control value={Math.ceil(current_edu / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_edu / 5).toString()} disabled />

                    <div>POW</div>
                    <Form.Control value={this.state.dice_pow} />
                    <Form.Control value={this.state.initial_pow.toString()} disabled />
                    <Form.Control value={current_pow.toString()} />
                    <Form.Control value={current_pow.toString()} disabled />
                    <Form.Control value={Math.ceil(current_pow / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_pow / 5).toString()} disabled />

                    <div>LUCK</div>
                    <Form.Control value={this.state.dice_luck} />
                    <Form.Control value={this.state.initial_luck.toString()} disabled />
                    <Form.Control value={current_luck.toString()} />
                    <Form.Control value={current_luck.toString()} disabled />
                    <Form.Control value={Math.ceil(current_luck / 2).toString()} disabled />
                    <Form.Control value={Math.ceil(current_luck / 5).toString()} disabled />

                    <div className="controller" />
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