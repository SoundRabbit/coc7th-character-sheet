const operators = new Map<string, number>([
    ['+', 1],
    ['-', 1],
    ['*', 2],
    ['/', 2],
    ['D', 3],
    ['d', 3]
]);

const dice = (n: number, d: number): number => {
    let result: number = 0;
    for (let i = 0; i < n; i++) {
        result += Math.floor(Math.random() * d) + 1;
    }
    return result;
}

const tokens = (src: string): string[] => {
    const result: string[] = [""];
    for (const c of src) {
        if (operators.get(c) || c == '(' || c == ')') {
            if (result[result.length - 1] === "") {
                result[result.length - 1] = c;
            } else {
                result.push(c);
            }
            result.push("");
        } else {
            result[result.length - 1] += c;
        }
    }
    return result;
}


const rpn = (tokens: string[]): string[] => {
    const ops: string[] = [];
    const result: string[] = [];

    for (const token of tokens) {
        const op_priority = operators.get(token);
        if (op_priority) {
            while (ops.length > 0) {
                if (op_priority <= (operators.get(ops[ops.length - 1]) || 0)) {
                    result.push(ops.pop() || "");
                }
            }
            ops.push(token);
        } else if (token == '(') {
            ops.push(token);
        } else if (token == ')') {
            while (ops[ops.length - 1] != '(') {
                result.push(ops.pop() || "");
                if (ops.length < 1) {
                    return [];
                }
            }
            ops.pop();
        } else {
            result.push(token);
        }
    }

    while (ops.length > 0) {
        const op = ops.pop() || "";
        if (op == '(') {
            return [];
        } else {
            result.push(op);
        }
    }

    return result;
}

const calc = (rpn_tokens: string[]): number => {
    const stack: string[] = [];
    for (const token of rpn_tokens) {
        if (operators.get(token)) {
            const v1 = Number(stack.pop());
            const v2 = Number(stack.pop());
            switch (token) {
                case '+':
                    stack.push((v1 + v2).toString());
                    break;
                case '-':
                    stack.push((v1 - v2).toString());
                    break;
                case '*':
                    stack.push((v1 * v2).toString());
                    break;
                case '/':
                    stack.push((v1 / v2).toString());
                    break;
                case 'D':
                case 'd':
                    stack.push(dice(v1, v2).toString());
                    break;
            }
        } else {
            stack.push(token);
        }
    }

    return Number(stack.pop());
}

export const exec = (exp: string): number => calc(rpn(tokens(exp)));