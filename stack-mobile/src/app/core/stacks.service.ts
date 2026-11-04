import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import { SaveStackDto, SetStackPositionDto, StackResponseDto, UpdateStackDto } from './api.models';

/** Tags: Stacks, WarehouseStacks, StackDeatils */
@Injectable({ providedIn: 'root' })
export class StacksService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/api`;

  // --- Stacks (per chamber) ---
  list(chamberId: number): Observable<StackResponseDto[]> {
    return this.http.get<StackResponseDto[]>(`${this.base}/chambers/${chamberId}/stacks`);
  }
  get(chamberId: number, stackId: number): Observable<StackResponseDto> {
    return this.http.get<StackResponseDto>(`${this.base}/chambers/${chamberId}/stacks/${stackId}`);
  }
  create(chamberId: number, dto: SaveStackDto): Observable<StackResponseDto> {
    return this.http.post<StackResponseDto>(`${this.base}/chambers/${chamberId}/stacks`, dto);
  }
  update(chamberId: number, stackId: number, dto: UpdateStackDto): Observable<void> {
    return this.http.put<void>(`${this.base}/chambers/${chamberId}/stacks/${stackId}`, dto);
  }
  delete(chamberId: number, stackId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/chambers/${chamberId}/stacks/${stackId}`);
  }
  setPosition(chamberId: number, stackId: number, dto: SetStackPositionDto): Observable<StackResponseDto> {
    return this.http.put<StackResponseDto>(`${this.base}/chambers/${chamberId}/stacks/${stackId}/position`, dto);
  }

  // --- WarehouseStacks ---
  byWarehouse(warehouseId: number, onlyUnpositioned = false): Observable<StackResponseDto[]> {
    const params = new HttpParams().set('onlyUnpositioned', onlyUnpositioned);
    return this.http.get<StackResponseDto[]>(`${this.base}/warehouses/${warehouseId}/stacks`, { params });
  }

  // --- StackDeatils (response shape not in swagger, typed loosely) ---
  stackDetails(warehouseId: number): Observable<unknown> {
    return this.http.get(`${this.base}/StackDeatils/GetStackDetailsById`, { params: { warehouseId } });
  }
  warehouseWrs(warehouseId: number): Observable<unknown> {
    return this.http.get(`${this.base}/StackDeatils/GetWarehouseWrsbyId`, { params: { warehouseId } });
  }
}
