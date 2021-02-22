import { BaseObject } from './BaseObject';

export class MultiObject extends BaseObject {
    static TYPE = 5;

    type = 5;
    lockselection = false;

    static fromFlat(arr) {
        return new MultiObject().initFromArray(arr);
    }
}