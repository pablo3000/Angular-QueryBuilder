import {Component} from '@angular/core';
import {Field, Rule} from '../../component/query-builder/query-builder-Interfaces';
import {FormsModule} from '@angular/forms';
import {JsonPipe} from '@angular/common';
import {Button} from 'primeng/button';
import {PrimeTemplate} from 'primeng/api';
import {ColorPicker} from 'primeng/colorpicker';
import {Slider} from 'primeng/slider';
import {Panel} from 'primeng/panel';
import {QueryBuilderComponent} from '../../component/query-builder/query-builder.component';

@Component({
  selector: 'app-query-builder-demo',
  imports: [
    QueryBuilderComponent,
    FormsModule,
    JsonPipe,
    Button,
    PrimeTemplate,
    ColorPicker,
    Slider,
    Panel,
  ],
  templateUrl: './query-builder-demo.component.html',
  styleUrl: './query-builder-demo.component.scss'
})
export class QueryBuilderDemoComponent {
  query = {"condition": "AND",
    "rules": [{"field": "nombre", "operator": "equal", "value": "Juan"}, {
      "field": "fecnac",
      "operator": "equal",
      "value": new Date()
    }, {"condition": "OR",
      "rules": [{"field": "activo", "operator": "equal", "value": false}, {
        "field": "rango",
        "operator": "equal",
        "value": 30
      }, {"condition": "AND",
        "rules": [{"field": "color", "operator": "equal", "value": "#36f700"}, {
          "field": "edad",
          "operator": "less",
          "value": 12
        }]
      }]
    }]
  };
  defaultRule: Rule = {"field": "nombre", "operator": "contains", "value": "ABC"};

  valid: boolean = false;

  fields: Field[] = [
    {
      name: 'nombre',
      label: 'Nombre',
      type: 'string',
    },
    {
      name: 'fecnac',
      label: 'Fecha de nacimiento',
      type: 'date',
      initialValue: new Date(),
    },
    {
      name: 'edad',
      label: 'Edad',
      type: 'number',
      initialValue: 18,
      allowedOperations: ["less", "greater"],
      valueProps: {suffix: " años"},
      validators: [
        {
          validate: (value: any) => value > 18,
          message: 'Debe ser mayor a 18 años'
        }
      ]
    },
    {
      name: 'activo',
      label: 'Activo',
      type: 'boolean',
      initialValue: false,
      allowedOperations: ['equal'],
    },
    {
      name: 'color',
      label: 'Color',
      type: 'string',
      allowedOperations: ['equal', "not_equal"],
      customControl: "colorControl"
    },
    {
      name: 'rango',
      label: 'Rango',
      type: 'number',
      customControl: "sliderControl",
      initialValue: 30
    }
  ];


  public onValid(valid: boolean) {
    this.valid = valid;
  }

}
