import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import {
  ChamberResponseDto, CompleteChamberSetupDto, CompleteChamberSetupResponseDto, CreateChamberDto,
  SaveChamberBoundaryDto, SetStackConfigDto, StackConfigResponseDto, UpdateChamberDto,
} from './api.models';

/** Tags: Chambers, ChamberSetup, StackConfig */
@Injectable({ providedIn: 'root' })
export class ChambersService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/api`;

  // --- Chambers ---
  byWarehouse(warehouseId: number): Observable<ChamberResponseDto[]> {
    return this.http.get<ChamberResponseDto[]>(`${this.base}/Chambers/by-warehouse/${warehouseId}`);
  }
  get(id: number): Observable<ChamberResponseDto> {
    return this.http.get<ChamberResponseDto>(`${this.base}/Chambers/${id}`);
  }
  create(dto: CreateChamberDto): Observable<ChamberResponseDto> {
    return this.http.post<ChamberResponseDto>(`${this.base}/Chambers`, dto);
  }
  update(id: number, dto: UpdateChamberDto): Observable<void> {
    return this.http.put<void>(`${this.base}/Chambers/${id}`, dto);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/Chambers/${id}`);
  }
  saveBoundary(id: number, dto: SaveChamberBoundaryDto): Observable<ChamberResponseDto> {
    return this.http.post<ChamberResponseDto>(`${this.base}/Chambers/${id}/boundary`, dto);
  }
  submit(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/Chambers/${id}/submit`, null);
  }

  // --- ChamberSetup (one-shot wizard save) ---
  completeSetup(dto: CompleteChamberSetupDto): Observable<CompleteChamberSetupResponseDto> {
    return this.http.post<CompleteChamberSetupResponseDto>(`${this.base}/chambers/setup`, dto);
  }

  // --- StackConfig ---
  getStackConfig(chamberId: number): Observable<StackConfigResponseDto> {
    return this.http.get<StackConfigResponseDto>(`${this.base}/chambers/${chamberId}/stack-config`);
  }
  setStackConfig(chamberId: number, dto: SetStackConfigDto): Observable<StackConfigResponseDto> {
    return this.http.post<StackConfigResponseDto>(`${this.base}/chambers/${chamberId}/stack-config`, dto);
  }
  confirmStackConfig(chamberId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/chambers/${chamberId}/stack-config/confirm`, null);
  }
}
