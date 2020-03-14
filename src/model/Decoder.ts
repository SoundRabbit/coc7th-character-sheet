type Decoder<T> = (x: any) => T

export type ErrorType = "TypeMissmatch";

export class Error<T> {
    private __description: T;
    private __errorType: ErrorType;

    constructor(description: T, errorType?: ErrorType) {
        this.__description = description;
        this.__errorType = errorType || "TypeMissmatch";
    }

    get description(): T {
        return this.description;
    }

    get errorType(): ErrorType {
        return this.__errorType;
    }
}

export const string: Decoder<string> = (x: any): string => {
    if (typeof x == "string") {
        return x;
    } else {
        throw new Error(`${x} is not a string value.`);
    }
}

export const number: Decoder<number> = (x: any): number => {
    if (typeof x == "number") {
        return x;
    } else {
        throw new Error(`${x} is not a number.`);
    }
}

export const boolean: Decoder<boolean> = (x: any): boolean => {
    if (typeof x == "boolean") {
        return x;
    } else {
        throw new Error(`${x} is not a boolean.`);
    }
}

export const object = <T>(decoders: { [P in keyof T]: Decoder<T[P]> }): Decoder<T> => {
    return (x: any): T => {
        if (typeof x == "object") {
            const result = {} as T;
            for (const key in decoders) {
                result[key] = decoders[key](x[key]);
            }
            return result;
        } else {
            throw new Error(`${x} is not an object.`);
        }
    }
}

export const array = <T>(decoder: Decoder<T>): Decoder<Array<T>> => {
    return (x: any): Array<T> => {
        if (Array.isArray(x)) {
            return x.map(decoder);
        } else {
            throw new Error(`${x} is not an array.`);
        }
    }
}

declare const None: unique symbol
type None = typeof None
type Push<H, A extends Array<any>> = ((head: H, ...a: A) => never) extends ((...a: infer T) => never) ? T : []
type HeadSlice<T extends Array<any>> = ((...a: T) => never) extends ((head: infer Head, ...others: infer Others) => never) ? [Head, Others] : [None, []]
type DecoderTuple<Tuple extends Array<any>, Result extends Array<Decoder<any>> = []> = {
    "done": Result
    "continue": DecoderTuple<HeadSlice<Tuple>[1], Push<Decoder<HeadSlice<Tuple>[0]>, Result>>
}[Tuple["length"] extends 0 ? "done" : "continue"]

export const tuple = <Tuple extends Array<any>>(decoders: DecoderTuple<Tuple>): Decoder<Tuple> => {
    return (x: any): Tuple => {
        if (Array.isArray(x)) {
            // Thease mean:
            // decoders.map((decoder, index) => decoder(x[index]))
            const __decoders: Array<Decoder<any>> = decoders as any;
            return (__decoders.map((decoder: any, index) => (decoder(x[index])))) as Tuple;
        } else {
            throw new Error(`${x} is not an array.`);
        }
    }
}

export const nullable = <T>(decoder: Decoder<T>): Decoder<T | null> => {
    return (x: any): T | null => {
        if (x == null) {
            return null;
        } else {
            return decoder(x);
        }
    };
}

export const convertableToString: Decoder<string> = (x: any): string => {
    return String(x);
}

export const convertableToNumber: Decoder<number> = (x: any): number => {
    const r = Number(x);
    if (isNaN(r)) {
        return r;
    } else {
        throw new Error(`${x} is not convertable to number.`);
    }
}

export const convertableToMap = <V>(decoder: Decoder<V>): Decoder<Map<string, V>> => {
    return (x: any): Map<string, V> => {
        if (typeof x == "object" && !Array.isArray(x)) {
            return new Map(Object.entries(x).map(([k, v]) => ([k, decoder(v)])));
        } else {
            throw new Error(`${x} is not convertable to Map.`);
        }
    }
}

export const forceToNumber: Decoder<number> = (x: any): number => {
    return Number(x);
}

export const tries = <T>(decoders: Decoder<T>[]): Decoder<T> => {
    return (x: any): T => {
        let errs = [];
        for (const decoder of decoders) {
            try {
                return decoder(x);
            } catch (err) {
                errs.push(err);
            }
        }
        throw errs;
    }
}