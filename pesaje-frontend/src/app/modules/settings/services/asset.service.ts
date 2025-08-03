import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, finalize, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  ICreateAssetModel,
  IReadAssetModel,
  IUpdateAssetModel,
} from '../interfaces/asset.interface';

const API_ASSETS_URL = `${environment.apiUrl}/asset`;

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  isLoading$: Observable<boolean>;
  private isLoadingSubject: BehaviorSubject<boolean>;

  constructor(private http: HttpClient) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.isLoading$ = this.isLoadingSubject.asObservable();
  }

  getAssetById(id: string): Observable<IReadAssetModel> {
    this.isLoadingSubject.next(true);
    return this.http.get<{ ok: boolean; data: IReadAssetModel }>(`${API_ASSETS_URL}/${id}`).pipe(
      map((response) => response.data),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  createAsset(assetData: ICreateAssetModel): Observable<IReadAssetModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ ok: boolean; data: IReadAssetModel }>(`${API_ASSETS_URL}`, assetData)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateAsset(id: string, assetData: IUpdateAssetModel): Observable<IReadAssetModel> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ ok: boolean; data: IReadAssetModel }>(`${API_ASSETS_URL}/${id}`, assetData)
      .pipe(
        map((response) => response.data),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getAllAssets(includeDeleted: boolean = false): Observable<IReadAssetModel[]> {
    this.isLoadingSubject.next(true);
    let params = new HttpParams().set(
      'includeDeleted',
      includeDeleted.toString()
    );

    return this.http
      .get<{ ok: boolean; data: IReadAssetModel[] }>(`${API_ASSETS_URL}`, {
        params,
      })
      .pipe(
        map((response) => response.data || []),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteAsset(id: string): Observable<{ message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ ok: boolean; message: string }>(`${API_ASSETS_URL}/${id}`)
      .pipe(
        map((response) => ({ message: response.message })),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }
}
