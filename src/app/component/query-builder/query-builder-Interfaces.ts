import {Operator} from './query-builder.component';

export interface Field {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  allowedOperations?: Operator[];
  validators?: Validator[];
  customControl?: any,
  initialValue?: any;
  valueProps?: {
    // Text input properties
    placeholder?: string;

    // Number input properties
    min?: number;
    max?: number;
    mask?: string;
    prefix?: string;
    suffix?: string;
    minFractionDigits?: number;
    maxFractionDigits?: number;
    useGrouping?: boolean;
    locale?: string;
    currency?: string;

    // Date input properties
    //El formato de salida es en ISO 8601
    dateFormat?: string;
    showTime?: boolean;
    showSeconds?: boolean;
    minDate?: Date;
    maxDate?: Date;
    hourFormat?: string
  }
}

export interface Operation {
  id: Operator;
  label: string;
  icon: string
}

export interface Rule {
  field: string;
  operator: string;
  value: any;
  errorMessage?: string;
}

export interface Validator {
  validate: (value: any) => boolean;
  message: string;
}

export interface RuleGroup {
  condition: 'AND' | 'OR';
  rules: (Rule | RuleGroup)[];
}
