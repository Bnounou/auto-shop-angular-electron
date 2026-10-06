import { Injectable } from '@angular/core';
import { Product } from '../models/models';

import JsBarcode from 'jsbarcode';

@Injectable({ providedIn: 'root' })
export class BarcodeService {
  generate(products: Product[]): string {
    let code = '';
    do {
      code = String(Math.floor(1000000000 + Math.random() * 8999999999));
    } while (products.some(p => p.barcode === code));
    return code;
  }

  /**
   * The printed barcode contains a compact, scanner-readable payload with
   * product name, product code and the final price including labour.
   */
  payload(product: Product): string {
    const name = encodeURIComponent(product.name.trim());
    const code = encodeURIComponent(product.barcode.trim());
    const price = this.finalPrice(product).toFixed(2);
    return `AS|${name}|${code}|${price}`;
  }

  finalPrice(product: Product): number {
    return Math.max(0, Number(product.salePrice) || 0) + Math.max(0, Number(product.labor) || 0);
  }

  render(svg: SVGElement, product: Product): void {
    const value = this.payload(product);
    if (!JsBarcode) throw new Error('JsBarcode n\'est pas chargé.');
    JsBarcode(svg, value, {
      format: 'CODE128',
      displayValue: true,
      fontSize: 12,
      height: 72,
      margin: 8,
      textMargin: 4,
      width: 2
    });
  }

  parse(value: string): { name: string; code: string; price: number } | null {
    const parts = value.split('|');
    if (parts.length !== 4 || parts[0] !== 'AS') return null;
    const price = Number(parts[3]);
    if (!Number.isFinite(price)) return null;
    try {
      return { name: decodeURIComponent(parts[1]), code: decodeURIComponent(parts[2]), price };
    } catch {
      return null;
    }
  }
}
