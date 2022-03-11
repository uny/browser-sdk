import { Observable } from '../../tools/observable';
export declare const ConsoleApiName: {
    readonly log: "log";
    readonly debug: "debug";
    readonly info: "info";
    readonly warn: "warn";
    readonly error: "error";
};
export declare type ConsoleApiName = typeof ConsoleApiName[keyof typeof ConsoleApiName];
export interface ConsoleLog {
    message: string;
    api: ConsoleApiName;
    stack?: string;
    handlingStack?: string;
}
export declare function initConsoleObservable(apis: ConsoleApiName[]): Observable<ConsoleLog>;
