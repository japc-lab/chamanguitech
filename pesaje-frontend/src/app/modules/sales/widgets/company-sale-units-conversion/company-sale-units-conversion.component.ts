import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ICompanySaleWholeDetailModel } from '../../interfaces/company-sale-whole-detail.interface';

@Component({
  selector: 'app-company-sale-units-conversion',
  templateUrl: './company-sale-units-conversion.component.html',
  styleUrls: ['./company-sale-units-conversion.component.scss'],
})
export class CompanySaleUnitsConversionComponent implements OnChanges {
  @Input() wholeDetail: ICompanySaleWholeDetailModel | null = null;

  summaryData: {
    class: string;
    size: string;
    quantityKg: number;
    quantityLb: number;
  }[] = [];
  totalSummary: { quantityKg: number; quantityLb: number } = {
    quantityKg: 0,
    quantityLb: 0,
  };

  // Conversion factor: 1 kg = 2.20462 lbs
  private readonly KG_TO_LB_FACTOR = 2.20462;
  private readonly LB_TO_KG_FACTOR = 1 / 2.20462;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['wholeDetail']) {
      this.calculateSummaryData();
    }
  }

  private calculateSummaryData(): void {
    if (!this.wholeDetail || !this.wholeDetail.items) {
      this.summaryData = [];
      this.totalSummary = { quantityKg: 0, quantityLb: 0 };
      return;
    }

    const summaryMap = new Map<
      string,
      { quantityKg: number; quantityLb: number }
    >();

    this.wholeDetail.items.forEach((item) => {
      if (!item.class || !item.size) return;

      const key = `${item.class}-${item.size}`;
      const amount = Number(item.amount || 0);

      if (!summaryMap.has(key)) {
        summaryMap.set(key, { quantityKg: 0, quantityLb: 0 });
      }

      const summary = summaryMap.get(key)!;

      if (item.unit === 'kg') {
        summary.quantityKg += amount;
        summary.quantityLb += amount * this.KG_TO_LB_FACTOR;
      } else if (item.unit === 'lb') {
        summary.quantityLb += amount;
        summary.quantityKg += amount * this.LB_TO_KG_FACTOR;
      }
    });

    this.summaryData = Array.from(summaryMap.entries()).map(([key, data]) => {
      const [className, size] = key.split('-');
      return {
        class: className,
        size: size,
        quantityKg: Number(data.quantityKg.toFixed(2)),
        quantityLb: Number(data.quantityLb.toFixed(2)),
      };
    });

    // Calculate totals
    let totalKg = 0;
    let totalLb = 0;

    this.summaryData.forEach((item) => {
      totalKg += item.quantityKg;
      totalLb += item.quantityLb;
    });

    this.totalSummary = {
      quantityKg: Number(totalKg.toFixed(2)),
      quantityLb: Number(totalLb.toFixed(2)),
    };
  }
}
