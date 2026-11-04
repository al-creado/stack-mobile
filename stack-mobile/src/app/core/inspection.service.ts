import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE } from './api-base';
import { toFormData } from './form-data';
import {
  EmployeeDocumentForm, EmployeeRegisterForm, StackInspectionForm, WarehouseStatusForm, WHRStackMappingRequest,
} from './api.models';

/** Tags: StackInspection, Employee (multipart uploads) */
@Injectable({ providedIn: 'root' })
export class InspectionService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/api`;

  submitInspection(form: StackInspectionForm): Observable<unknown> {
    // Send blocks both as indexed fields and as BlocksJson, since the API accepts either.
    const payload = { ...form, BlocksJson: form.Blocks?.length ? JSON.stringify(form.Blocks) : undefined };
    return this.http.post(`${this.base}/StackInspection/StackInspection`, toFormData(payload));
  }

  updateWarehouseStatus(form: WarehouseStatusForm): Observable<unknown> {
    return this.http.post(`${this.base}/StackInspection/UpdateWarehouseStatus`, toFormData({ ...form }));
  }

  saveWrsMapping(req: WHRStackMappingRequest): Observable<unknown> {
    return this.http.post(`${this.base}/StackInspection/SaveMultiple`, req);
  }

  // --- Employee ---
  missingDocuments(empId: string): Observable<unknown> {
    return this.http.get(`${this.base}/Employee/missing-documents/${encodeURIComponent(empId)}`);
  }
  uploadDocument(form: EmployeeDocumentForm): Observable<unknown> {
    return this.http.post(`${this.base}/Employee/upload-document`, toFormData({ ...form }));
  }
  registerEmployee(form: EmployeeRegisterForm): Observable<unknown> {
    return this.http.post(`${this.base}/Employee/register`, toFormData({ ...form }));
  }
}
