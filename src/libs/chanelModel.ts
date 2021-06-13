export enum PayloadState {
    "ON_TAKING" = 1,
    "IDLE" = 0,
    "ON_SHARING" = 2
}

export interface _IFileContent {
    fileId: string;
    totalPart: Number;
    partId: Number;
    state: PayloadState;
}

export interface IFileContent extends Partial<_IFileContent> { };
export interface IPayloads { [fileId: string]: { [partId: string]: IFileContent } };
export interface _ChanelActor {
    id: string;
    isSourceOwner: boolean;
    payloads: IPayloads;
    numberOnSharingWith: number;
}

export interface ChanelActor extends Partial<_ChanelActor> { };
export interface ChanelActors { [chanelId: string]: ChanelActor };
export interface HighPiorityPart { [fileId: string]: Number[] };
export interface _SignalingChanel {
    chanelId: string;
    accessKey: string; // Key to access chanel
    sourceOwnerId: string;
    actors: { [chanelId: string]: ChanelActor };
    highPiorityPart: HighPiorityPart;
}

export interface SignalingChanel extends Partial<_SignalingChanel> { };
