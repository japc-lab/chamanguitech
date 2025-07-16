import { Component, Input, OnInit } from '@angular/core';
import { SizeTypeEnum } from '../../../interfaces/size.interface';

@Component({
  selector: 'app-best-prices-table',
  templateUrl: './best-prices-table.component.html',
  styleUrl: './best-prices-table.component.scss',
})
export class BestPricesTableComponent implements OnInit {
  @Input() typeSize: any;
  processedData: any[] = [];

  ngOnInit(): void {
    this.processData();
  }

  private processData(): void {
    if (!this.typeSize?.sizes) return;

    this.processedData = this.typeSize.sizes.map((sizeGroup: any) => {
      // Obtener tamaños únicos para este grupo
      const uniqueSizes = this.getUniqueSizes(sizeGroup);

      return {
        type: sizeGroup.type,
        sizes: uniqueSizes.map((size: string) => ({
          name: size,
          companies: sizeGroup.companies.map((company: any) => {
            const sizePrice = company.sizePrices.find(
              (sp: any) => sp.size.size === size
            );
            return {
              company: company.company,
              price: sizePrice ? sizePrice.price : 0,
              highest: sizePrice
                ? this.isHighestPrice(
                    sizeGroup.companies,
                    size,
                    sizePrice.price
                  )
                : false,
            };
          }),
        })),
      };
    });
  }

  private getUniqueSizes(sizeGroup: any): string[] {
    const sizes = new Set<string>();
    sizeGroup.companies.forEach((company: any) => {
      company.sizePrices.forEach((sp: any) => sizes.add(sp.size.size));
    });
    return Array.from(sizes);
  }

  private isHighestPrice(
    companies: any[],
    size: string,
    price: number
  ): boolean {
    if (price <= 0) return false;

    const allPrices = companies.map((company) => {
      const sizePrice = company.sizePrices.find(
        (sp: any) => sp.size.size === size
      );
      return sizePrice ? sizePrice.price : 0;
    });

    return price === Math.max(...allPrices);
  }

  getGroupTypeLabel(type: string): string {
    switch (type) {
      case SizeTypeEnum['TAIL-A']:
        return 'COLA A';
      case SizeTypeEnum['TAIL-A-']:
        return 'COLA A-';
      case SizeTypeEnum['TAIL-B']:
        return 'COLA B';
      default:
        return type;
    }
  }
}
