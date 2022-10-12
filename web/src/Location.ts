export type ParameterType='NUMBER'|'VALUE'|'TEST'|'CHOICE';
export type Unit ='VOLT'| 'AMPERE'| 'WATT'| 'METER'
export interface LocationParameterDefinition{
    id: number
    name: string
    type: ParameterType
    unit?: Unit
    values: string[]
}

export interface Location{
    id: number;
    name: string;
    parameterDefinitions: LocationParameterDefinition[]
}