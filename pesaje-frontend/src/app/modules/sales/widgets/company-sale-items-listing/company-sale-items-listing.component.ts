import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { PERMISSION_ROUTES } from '../../../../constants/routes.constants';
import { InputUtilsService } from 'src/app/utils/input-utils.service';
import { FormUtilsService } from 'src/app/utils/form-utils.service';
import { ILogisticsItemModel } from 'src/app/modules/logistics/interfaces/logistics-item.interface';
import { Config } from 'datatables.net';
import { ICompanySaleItemModel } from '../../interfaces/company-sale-item.interface';
import { Subscription, map } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { SizeService } from 'src/app/modules/shared/services/size.service';
import {
  IReadSizeModel,
  SizeTypeEnum,
} from 'src/app/modules/shared/interfaces/size.interface';
import { PeriodService } from 'src/app/modules/shared/services/period.service';
import { IReadPeriodModel } from 'src/app/modules/shared/interfaces/period.interface';
import { SaleStyleEnum } from '../../interfaces/sale.interface';

@Component({
  selector: 'app-company-sale-items-listing',
  templateUrl: './company-sale-items-listing.component.html',
  styleUrl: './company-sale-items-listing.component.scss',
})
export class CompanySaleItemsListingComponent implements OnInit {
  PERMISSION_ROUTE = PERMISSION_ROUTES.SALES.COMPANY_SALE_FORM;

  private _periodId: string;
  private _companySaleItems: ICompanySaleItemModel[] = [];

  private unsubscribe: Subscription[] = [];

  @Input()
  set periodId(value: string) {
    if (value) {
      this._periodId = value;
      this.loadPeriod();
    }
  }

  @Input()
  set companySaleItems(value: ICompanySaleItemModel[]) {
    this._companySaleItems = value ?? [];
    this.datatableConfig = {
      ...this.datatableConfig,
      data: [...this._companySaleItems],
    };

    this.calculateTotals();

    this.cdr.detectChanges();
    this.reloadEvent.emit(true);
  }

  @Input() canAddItems: boolean;

  @Output() companySaleItemsChange = new EventEmitter<
    ICompanySaleItemModel[]
  >();

  @ViewChild('myForm') myForm!: NgForm;

  isLoading = false;
  isWhole = false;
  isResidual = false;

  poundsGrandTotal: number = 0;
  grandTotal: number = 0;
  percentageTotal: number = 0;

  reloadEvent: EventEmitter<boolean> = new EventEmitter();

  companySaleItem: ICompanySaleItemModel = {} as ICompanySaleItemModel;

  companySaleStyles: SaleStyleEnum[];
  companySaleStylesLabels: { [key in SaleStyleEnum]?: string } = {};

  wholeSizes: IReadSizeModel[];
  tailSizes: IReadSizeModel[];
  residualSizes: IReadSizeModel[];
  shrimpClassList: { type: string; label: string }[] = [];
  sizeList: string[] = [];
  periodModel: IReadPeriodModel;

  datatableConfig: Config = {
    serverSide: false,
    paging: true,
    pageLength: 10,
    data: [], // ✅ Ensure default is an empty array
    columns: [
      {
        title: 'Estilo',
        data: 'style',
        render: function (data) {
          if (!data && data !== 0) return '-';

          if (data === SaleStyleEnum.WHOLE) return 'Entero';
          else if (data === SaleStyleEnum.RESIDUAL) return 'Residual';

          return 'Cola';
        },
      },
      {
        title: 'Clase',
        data: 'class',
        render: function (data, type, full) {
          if (!data && data !== 0) return '-';

          if (full.style === SaleStyleEnum.WHOLE) {
            return data;
          }

          return data.replace('TAIL-', '');
        },
      },
      {
        title: 'Talla',
        data: 'size',
      },
      {
        title: 'Libras (lb)',
        data: 'pounds',
        render: function (data) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(data);

          return `${formatted}`;
        },
      },
      {
        title: 'Precio Referencial($)',
        data: 'referencePrice',
        render: function (data) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(data);

          return `$${formatted}`;
        },
      },
      {
        title: 'Precio ($)',
        data: 'price',
        render: function (data) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(data);

          return `$${formatted}`;
        },
      },
      {
        title: 'Total ($)',
        data: 'total',
        render: function (data) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(data);

          return `$${formatted}`;
        },
      },
      {
        title: '%',
        data: 'percentage',
        render: function (data) {
          if (!data && data !== 0) return '-';

          const formatted = new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(data);

          return `${formatted}%`;
        },
      },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json',
    },
    createdRow: function (row, data, dataIndex) {
      $('td:eq(0)', row).addClass('d-flex align-items-center');
    },
  };

  get companySaleItems(): ICompanySaleItemModel[] {
    return this._companySaleItems;
  }

  constructor(
    private sizeService: SizeService,
    private periodService: PeriodService,
    private inputUtils: InputUtilsService,
    private formUtils: FormUtilsService,
    private cdr: ChangeDetectorRef
  ) { }

  get periodId(): string {
    return this._periodId;
  }

  ngOnInit(): void {
    this.loadSizes();
    this.companySaleStylesLabels = {
      [SaleStyleEnum.WHOLE]: 'Entero',
      [SaleStyleEnum.TAIL]: 'Cola',
      [SaleStyleEnum.RESIDUAL]: 'Residual',
    };
    this.companySaleStyles = Object.values(SaleStyleEnum);
  }

  loadSizes(): void {
    const sizesSub = this.sizeService
      .getSizes(
        [
          SizeTypeEnum.WHOLE,
          SizeTypeEnum['TAIL-A'],
          SizeTypeEnum['TAIL-A-'],
          SizeTypeEnum['TAIL-B'],
          SizeTypeEnum.RESIDUAL,
        ].join(',')
      )
      .subscribe({
        next: (sizes) => {
          this.wholeSizes = sizes.filter(
            (size) => size.type === SizeTypeEnum.WHOLE
          );
          this.tailSizes = sizes.filter(
            (size) => (size.type !== SizeTypeEnum.WHOLE && size.type !== SizeTypeEnum.RESIDUAL)
          );
          this.residualSizes = sizes.filter(
            (size) => size.type === SizeTypeEnum.RESIDUAL
          );

          const uniqueTypes = new Set(this.tailSizes.map((s) => s.type));
          this.shrimpClassList = Array.from(uniqueTypes).map((type) => ({
            type,
            label: type.replace('TAIL-', ''),
          }));
        },
        error: (err) => {
          console.error('Error al cargar tallas', err);
        },
      });

    this.unsubscribe.push(sizesSub);
  }

  loadPeriod(): void {
    const periodSub = this.periodService
      .getPeriodById(this.periodId)
      .subscribe({
        next: (period) => {
          this.periodModel = period;
        },
        error: (err) => {
          console.error('Error al cargar período', err);
        },
      });

    this.unsubscribe.push(periodSub);
  }

  onSubmit(event: Event, myForm: NgForm): void {
    if (myForm?.invalid) return;

    this.isLoading = true;

    const complete = () => {
      this.isLoading = false;
    };

    const updateDatatableAndNotify = () => {
      const totalSum = this.companySaleItems.reduce(
        (sum, item) => sum + Number(item.total || 0),
        0
      );

      this.companySaleItems = this.companySaleItems.map((item) => ({
        ...item,
        percentage:
          totalSum > 0 ? (Number(item.total || 0) / totalSum) * 100 : 0,
      }));

      this.datatableConfig = {
        ...this.datatableConfig,
        data: [...this.companySaleItems],
      };

      this.calculateTotals();

      this.cdr.detectChanges();
      this.reloadEvent.emit(true);

      this.companySaleItemsChange.emit(this.companySaleItems);
      complete();
    };

    if (this.companySaleItem.id) {
      // Update existing item
      const index = this.companySaleItems.findIndex(
        (item) => item.id === this.companySaleItem.id
      );

      if (index > -1) {
        this.companySaleItems[index] = { ...this.companySaleItem }; // Ensure copy
      }

      updateDatatableAndNotify();
    } else {
      // Create new item
      this.companySaleItem.id = uuidv4();
      this.companySaleItems.push({ ...this.companySaleItem });

      updateDatatableAndNotify();
    }
  }

  create() {
    this.companySaleItem = {} as ICompanySaleItemModel;
  }

  delete(id: string): void {
    this.companySaleItems = this.companySaleItems.filter(
      (item) => item.id !== id
    );

    this.datatableConfig = {
      ...this.datatableConfig,
      data: [...this.companySaleItems],
    };

    this.calculateTotals();

    this.cdr.detectChanges();
    this.reloadEvent.emit(true);

    this.companySaleItemsChange.emit(this.companySaleItems);
  }

  edit(id: string): void {
    const foundItem = this.companySaleItems.find((item) => item.id === id);
    this.companySaleItem = foundItem ?? ({} as ICompanySaleItemModel);

    this.isWhole = this.companySaleItem.style === SaleStyleEnum.WHOLE;
    this.isResidual = this.companySaleItem.style === SaleStyleEnum.RESIDUAL;
    if (this.isWhole) {
      this.sizeList = this.wholeSizes.map((size) => size.size);
    } else if (this.isResidual) {
      this.sizeList = this.residualSizes.map((size) => size.size);
    } else {
      if (this.companySaleItem.class) {
        this.sizeList = this.tailSizes
          .filter((size) => size.type === this.companySaleItem.class)
          .map((size) => size.size);
      }
    }
  }

  calculateTotals(): void {
    this.poundsGrandTotal = this.companySaleItems.reduce(
      (sum, item) => sum + Number(item.pounds || 0),
      0
    );

    this.grandTotal = this.companySaleItems.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );

    this.percentageTotal = this.companySaleItems.reduce(
      (sum, item) => sum + Number(item.percentage || 0),
      0
    );
  }

  validateNumber(event: KeyboardEvent) {
    this.inputUtils.validateNumber(event);
  }

  formatDecimal(controlName: string) {
    const control = this.myForm.controls[controlName];
    if (control) {
      this.formUtils.formatControlToDecimal(control); // ✅ Use utility function
      this.onInputChange();
    }
  }

  onInputChange(): void {
    const pounds = Number(this.companySaleItem.pounds) || 0;
    const price = Number(this.companySaleItem.price) || 0;
    this.companySaleItem.total = pounds * price;
  }

  onStyleChange(style: string): void {
    this.companySaleItem.class = '';
    this.companySaleItem.size = '';
    this.companySaleItem.referencePrice = undefined;

    this.isWhole = style === SaleStyleEnum.WHOLE;
    this.isResidual = style === SaleStyleEnum.RESIDUAL;
    if (this.isWhole) {
      this.sizeList = this.wholeSizes.map((size) => size.size);
    } else if (this.isResidual) {
      this.sizeList = this.residualSizes.map((size) => size.size);
    } else {
      if (this.companySaleItem.class) {
        this.sizeList = this.tailSizes
          .filter((size) => size.type === this.companySaleItem.class)
          .map((size) => size.size);
      }
    }
  }

  onClassChange(selectedClass: string): void {
    this.companySaleItem.size = '';
    this.companySaleItem.referencePrice = undefined;

    this.sizeList = this.tailSizes
      .filter((size) => size.type === selectedClass)
      .map((size) => size.size);
  }

  onSizeChange(size: string): void {
    if (this.companySaleItem.style === SaleStyleEnum.WHOLE) {
      this.companySaleItem.referencePrice = this.periodModel.sizePrices?.filter(
        (x) => x.size.size === size && x.size.type === SizeTypeEnum.WHOLE
      )[0].price;
    } else if (this.companySaleItem.style === SaleStyleEnum.RESIDUAL) {
      this.companySaleItem.referencePrice = this.periodModel.sizePrices?.filter(
        (x) => x.size.size === size && x.size.type === SizeTypeEnum.RESIDUAL
      )[0].price;
    } else {
      this.companySaleItem.referencePrice = this.periodModel.sizePrices?.filter(
        (x) =>
          x.size.size === size && x.size.type === this.companySaleItem.class
      )[0].price;
    }
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones
    this.unsubscribe.forEach((sub) => sub.unsubscribe());
    this.reloadEvent.unsubscribe();
  }
}
