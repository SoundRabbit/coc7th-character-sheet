export const tokens = (src: string): string[] => {
    const result: string[] = [];
    for (const c of src) {
        if (['+', '-', '*', '/', '(', ')', 'd', 'D'].indexOf(c) >= 0) {
            result.push(c);
        } else {
            if (result.length > 0) {
                result[-1] += c;
            } else {
                result.push(c);
            }
        }
    }
    return result;
}

console.log(tokens("3d6+10+3d5d78+(2d4+1)/2876"));