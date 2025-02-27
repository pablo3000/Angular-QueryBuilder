import {
  Component,
  forwardRef,
  input,
  Output,
  EventEmitter,
  ContentChildren,
  QueryList,
  signal,
  computed,
} from '@angular/core';
import {NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule} from '@angular/forms';
import {InputNumber} from "primeng/inputnumber";
import {InputSwitch} from "primeng/inputswitch";
import {NgForOf, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, NgTemplateOutlet} from "@angular/common";
import {Button, ButtonDirective} from "primeng/button";
import {InputText} from "primeng/inputtext";
import {DatePicker} from "primeng/datepicker";
import {Select} from "primeng/select";
import {SelectButton} from "primeng/selectbutton";
import {Tooltip} from "primeng/tooltip";
import {PrimeTemplate} from "primeng/api";
import {Field, Operation, Rule, RuleGroup} from './query-builder-Interfaces';

const queryBuilderText = {
  tooltip: {
    new_rule: "Nueva Regla",
    new_group_rule: "Nuevo grupo de regla",
    delete_rule: "Eliminar regla",
    delete_group_rule: "Eliminar grupo de regla"
  },
  operations: {
    equal: "Igual",
    not_equal: "Distinto",
    contains: "Contiene",
    begins_with: "Comenzar con",
    ends_with: "Terminar con",
    less: "Menor a",
    greater: "Mayor a",
    in: "En",
    not_in: "No en",
    between: "Entre"
  },
  conditions: {
    and: "Y",
    or: "O"
  }
};

export type Operator =
  | 'equal'
  | 'not_equal'
  | 'contains'
  | 'begins_with'
  | 'ends_with'
  | 'less'
  | 'greater'
  | 'between'
  | 'in'
  | 'not_in';

/**
 * QueryBuilder desarrollado en Angular 19
 * @author Pablo M. Chabás-Santa Fe-Argentina
 * @see https://github.com/pablo3000
 * @see https://querybuilder.js.org/
 * @version Beta 1.0
 * @todo Agregar soporte para I18N
 * @todo Mejorar diseño
 */
@Component({
  selector: 'app-query-builder',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QueryBuilderComponent),
      multi: true
    }
  ],
  templateUrl: './query-builder.component.html',
  imports: [
    SelectButton,
    FormsModule,
    NgSwitch,
    InputNumber,
    InputSwitch,
    NgSwitchDefault,
    NgSwitchCase,
    InputText,
    NgIf,
    NgForOf,
    DatePicker,
    Select,
    Button,
    PrimeTemplate,
    Tooltip,
    NgTemplateOutlet,
    ButtonDirective
  ],
  styleUrls: ['./query-builder.component.scss', '../../Lib-Icon/style.css']
})
export class QueryBuilderComponent implements ControlValueAccessor {
  protected readonly queryBuilderText = queryBuilderText;
  @ContentChildren(PrimeTemplate) templates: QueryList<PrimeTemplate> | undefined;

  // Input signals
  fields = input.required<Field[]>();
  allowGroups = input<Boolean>(true);
  defaultRule = input<Rule | undefined>();
  isRoot = input<Boolean>(true);
  disabled = input<boolean>(false);
  showTooltip = input<Boolean>(true);
  customTemplates = input<QueryList<PrimeTemplate> | undefined>();

  // Output
  @Output() removeRequest = new EventEmitter<void>();
  @Output() valid = new EventEmitter<boolean>();

  private childValidStates = signal<Map<number, boolean>>(new Map());
  query = signal<RuleGroup>({
    condition: 'AND',
    rules: []
  });

  templatesSignal = computed(() => this.templates);
  externalTemplatesSignal = computed(() => this.customTemplates());
  newRuleTemplate = computed(() => this.defaultRule());

  combinedTemplates = computed(() => {
    const localTemplates = this.templatesSignal();
    const externalTemplates = this.externalTemplatesSignal();

    if (localTemplates && externalTemplates) {
      const newList = new QueryList<PrimeTemplate>();
      newList.reset([
        ...Array.from(localTemplates),
        ...Array.from(externalTemplates)
      ]);
      return newList;
    }
    return localTemplates || externalTemplates || undefined;
  });


  conditions = [
    {label: queryBuilderText.conditions.and, value: 'AND'},
    {label: queryBuilderText.conditions.or, value: 'OR'}
  ];

  private operationsDef: Operation[] = [
    {id: "equal", label: queryBuilderText.operations.equal, icon: 'pi icon-equals'},
    {id: "not_equal", label: queryBuilderText.operations.not_equal, icon: 'pi icon-not-equal'},
    {id: "contains", label: queryBuilderText.operations.contains, icon: 'pi icon-contains'},
    {id: "begins_with", label: queryBuilderText.operations.begins_with, icon: 'pi icon-starts-with'},
    {id: "ends_with", label: queryBuilderText.operations.ends_with, icon: 'pi icon-ends-with'},
    {id: "less", label: queryBuilderText.operations.less, icon: 'pi icon-less-than'},
    {id: "greater", label: queryBuilderText.operations.greater, icon: 'pi icon-greater'},
    {id: "in", label: queryBuilderText.operations.in, icon: 'pi icon-contains'},
    {id: "not_in", label: queryBuilderText.operations.not_in, icon: 'pi icon-does-not-contain'},
    {id: "between", label: queryBuilderText.operations.between, icon: 'pi icon-between'},
  ];

  private defaultStringOperations: Operator[] = ['equal', "not_equal", "begins_with", "ends_with", "contains"];
  private defaultNumberOperations: Operator[] = ['equal', "not_equal", "less", "greater"];
  private defaultBooleanOperations: Operator[] = ['equal', "not_equal"];
  private defaultDateOperations: Operator[] = ['equal', "not_equal", "less", "greater", "between"];

  private onChange: any = () => {
  };
  private onTouch: any = () => {
  };

  writeValue(value: RuleGroup): void {
    if (value) {
      this.query.set(value);

      setTimeout(() => {
        this.validateAllRules();
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  isRule(rule: Rule | RuleGroup): rule is Rule {
    return (rule as Rule).field !== undefined;
  }

  getFieldType(fieldName: string): string {
    const field = this.fields().find(f => f.name === fieldName);
    return field ? field.type : 'string';
  }

  getOperationsForField(fieldName: string): Operation[] {
    const field = this.fields().find(f => f.name === fieldName);
    if (field && field.allowedOperations) {
      return this.findOperators(field.allowedOperations)
    }
    let ops: Operator[]

    switch (field?.type) {
      case "string":
        ops = this.defaultStringOperations;
        break;
      case "number":
        ops = this.defaultNumberOperations;
        break;
      case "boolean":
        ops = this.defaultBooleanOperations;
        break;
      default:
        ops = this.defaultDateOperations;
    }
    return this.findOperators(ops);
  }

  private findOperators(operator: Operator[]): Operation[] {
    return this.operationsDef.filter(op => operator.includes(op.id));
  }

  addRule() {
    this.query.update(query => {
      const updatedQuery = {...query};
      updatedQuery.rules = [...query.rules, this.getNewRule()];
      return updatedQuery;
    });
    this.onQueryChange();
  }

  protected getNewRule(): Rule {
    if (this.defaultRule()) {
      return JSON.parse(JSON.stringify(this.defaultRule()));
    } else {
      const defaultField = this.fields()[0];
      const initialValue = defaultField.type === 'string' ? '' : null;
      return {
        field: defaultField.name,
        operator: this.getOperationsForField(defaultField.name)[0].id,
        value: initialValue
      };
    }
  }

  addGroup() {
    this.query.update(query => {
      const updatedQuery = {...query};
      updatedQuery.rules = [...query.rules, {
        condition: 'AND',
        rules: [this.getNewRule()]
      }];
      return updatedQuery;
    });
    this.onQueryChange();
  }

  removeRule(index: number) {
    this.query.update(query => {
      const updatedQuery = {...query};
      updatedQuery.rules = query.rules.filter((_, i) => i !== index);
      return updatedQuery;
    });

    this.childValidStates.update(map => {
      const updatedMap = new Map(map);
      updatedMap.delete(index);
      const newMap = new Map<number, boolean>();
      updatedMap.forEach((value, key) => {
        if (key > index) {
          newMap.set(key - 1, value);
        } else {
          newMap.set(key, value);
        }
      });
      return newMap;
    });

    if (!this.isRoot() && this.query().rules.length === 0) {
      this.removeGroup();
      return;
    }

    this.onQueryChange();
  }

  onOperatorChange(rule: Rule) {
    const field = this.fields().find(f => f.name === rule.field);

    if (field && field.type === 'date') {
      if (rule.operator === 'between' && !Array.isArray(rule.value)) {
        rule.value = [rule.value || new Date(), rule.value || new Date()];
      } else if (rule.operator !== 'between' && Array.isArray(rule.value)) {
        rule.value = rule.value[0] || new Date();
      }
    }

    if (field) {
      rule.errorMessage = this.validateValue(field, rule.value);
    }

    this.validateAndEmit();
    this.onQueryChange();
  }

  onFieldChange(rule: Rule) {
    const field = this.fields().find(f => f.name === rule.field);
    rule.operator = this.getOperationsForField(rule.field)[0].id;

    if (field) {
      if (field.initialValue !== undefined) {
        rule.value = field.initialValue;
      } else {
        switch (field.type) {
          case 'string':
            rule.value = '';
            break;
          case 'number':
            rule.value = null;
            break;
          case 'boolean':
            rule.value = false;
            break;
          case 'date':
            rule.value = new Date();
            break;
          default:
            rule.value = null;
        }
      }
      rule.errorMessage = this.validateValue(field, rule.value);
    } else {
      rule.value = null;
    }
    this.validateAndEmit();
    this.onQueryChange();
  }

  onQueryChange() {
    const queryValue = this.query();
    this.onChange(queryValue);
    this.onTouch();
  }

  getValueProps(fieldName: string): Field['valueProps'] {
    return this.fields().find(f => f.name === fieldName)?.valueProps;
  }

  removeGroup() {
    this.removeRequest.emit();
  }

  private validateValue(field: Field, value: any): string | undefined {
    if (field.validators) {
      for (const validator of field.validators) {
        if (!validator.validate(value)) {
          return validator.message
        }
      }
    }
    return undefined;
  }

  onFocusout(rule: Rule) {
    const field = this.fields().find((f) => f.name === rule.field);
    if (field) {
      const errorMessage = this.validateValue(field, rule.value);
      rule.errorMessage = errorMessage;
      if (!errorMessage) {
        this.onQueryChange();
      }
    }
    this.validateAndEmit();
  }

  private validateRuleGroup(group: RuleGroup): boolean {
    for (let i = 0; i < group.rules.length; i++) {
      const rule = group.rules[i];
      if (this.isRule(rule)) {
        if (rule.errorMessage) {
          return false;
        }
      } else {
        if (this.isRoot() && this.childValidStates) {
          const validState = this.childValidStates().get(i);
          if (validState !== undefined && !validState) {
            return false;
          }
        } else if (!this.validateRuleGroup(rule)) {
          return false;
        }
      }
    }
    return true;
  }

  private validateAllRules() {
    const validateRule = (rule: Rule | RuleGroup) => {
      if (this.isRule(rule)) {
        const field = this.fields().find(f => f.name === rule.field);
        if (field) {
          rule.errorMessage = this.validateValue(field, rule.value);
        }
      } else {
        rule.rules.forEach(validateRule);
      }
    };
    this.query().rules.forEach(validateRule);
    this.validateAndEmit();
  }

  private validateAndEmit() {
    const isValid = this.validateRuleGroup(this.query());
    this.valid.emit(isValid);
  }

  handleChildValidation(isValid: boolean, index: number) {
    this.childValidStates.update(map => {
      const updatedMap = new Map(map);
      updatedMap.set(index, isValid);
      return updatedMap;
    });
    this.validateAndEmit();
  }

  showDeleteRuleButton(index: number): boolean {
    const query = this.query();
    return !(this.isRoot() && query.rules.length === 1 && this.isRule(query.rules[0]));
  }

  // Custom Controls
  hasCustomControl(fieldName: string): boolean {
    const field = this.fields().find(f => f.name === fieldName);
    return !!field?.customControl;
  }

  getCustomControl(fieldName: string): any {
    const field = this.fields().find(f => f.name === fieldName);
    if (!field?.customControl) return null;

    const allTemplates = this.combinedTemplates();
    if (!allTemplates) return null;

    const template = allTemplates.find(t => t.name === field.customControl);
    return template?.template || null;
  }

  handleCustomControlChange(rule: Rule, event: any) {
    if (event && typeof event === 'object' && 'value' in event) {
      rule.value = event.value;
    } else {
      rule.value = event;
    }
    this.onQueryChange();
  }
}
