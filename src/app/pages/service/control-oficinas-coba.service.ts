import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_BASE_URL } from '@/app/api-config';

export interface Responsable {
    nombre: string;
    puesto: string;
    numero: string;
}

export interface HistorialPago {
    id?: string;
    mesAnio: string; // e.g. "2026-07" or "Julio 2026"
    estatus: 'pagado' | 'pendiente' | 'atrasado' | 'finalizado';
    montoPagado: number;
    fechaPago?: string;
    notas?: string;
}

export interface OficinaRecord {
    id?: string;
    _id?: string;
    numeroOficina: string;
    responsablePrincipal: Responsable;
    responsablesAdicionales?: Responsable[];
    cuantoPaga: number;
    diaCortePago: number | string;
    fechaInicioContrato?: string;
    status: 'pagado' | 'pendiente' | 'atrasado' | 'finalizado';
    historialPagos?: HistorialPago[];
    createdAt?: string;
    updatedAt?: string;
}

export function computeOficinaStatus(item: OficinaRecord, now: Date = new Date()): 'pagado' | 'pendiente' | 'atrasado' | 'finalizado' {
    // Si el contrato está marcado como finalizado, respetar ese estado
    if (item.status === 'finalizado') return 'finalizado';

    const currentYearMonth = now.toISOString().substring(0, 7); // "YYYY-MM"

    const currentDay = now.getDate();
    const cutoffDay = Number(item.diaCortePago) || 1;

    // Buscar si ya existe un registro de pago guardado para el mes actual
    const currentMonthRecord = item.historialPagos?.find(h => h.mesAnio === currentYearMonth);

    if (currentMonthRecord) {
        if (currentMonthRecord.estatus === 'pagado') {
            return 'pagado';
        }
        if (currentMonthRecord.estatus === 'atrasado') {
            return 'atrasado';
        }
        if (currentMonthRecord.estatus === 'pendiente') {
            if (currentDay >= cutoffDay) {
                return 'atrasado';
            }
            return 'pendiente';
        }
    }

    // Si aún no hay registro explícito para el mes actual:
    // Antes del día de corte -> Pendiente por automático al inicio de mes
    // En o después del día de corte -> Atrasado (no pagado)
    if (currentDay >= cutoffDay) {
        return 'atrasado';
    }
    return 'pendiente';
}

@Injectable({
    providedIn: 'root'
})
export class ControlOficinasCobaService {
    private apiUrl = `${API_BASE_URL}/api/control-oficinas`;
    private recordsSubject = new BehaviorSubject<OficinaRecord[]>([]);

    constructor(private http: HttpClient) {
        this.loadRecords();
    }

    private loadRecords() {
        this.http.get<any[]>(this.apiUrl).subscribe({
            next: (records) => {
                if (Array.isArray(records)) {
                    const mapped = records.map(r => {
                        const rec: OficinaRecord = {
                            ...r,
                            id: r._id?.toString() || r.id,
                            responsablesAdicionales: r.responsablesAdicionales || [],
                            historialPagos: r.historialPagos || []
                        };
                        rec.status = computeOficinaStatus(rec);
                        return rec;
                    });
                    this.recordsSubject.next(mapped);
                } else {
                    this.recordsSubject.next([]);
                }
            },
            error: (err) => {
                console.error('Error cargando oficinas de Coba:', err);
                this.recordsSubject.next([]);
            }
        });
    }

    getRecords(): Observable<OficinaRecord[]> {
        return this.recordsSubject.asObservable();
    }

    refresh(): void {
        this.loadRecords();
    }

    create(record: Omit<OficinaRecord, 'id' | '_id'>): Observable<any> {
        return new Observable(observer => {
            this.http.post(this.apiUrl, record).subscribe({
                next: (res) => {
                    this.loadRecords();
                    observer.next(res);
                    observer.complete();
                },
                error: (err) => {
                    console.error('Error al crear oficina:', err);
                    observer.error(err);
                }
            });
        });
    }

    update(id: string, record: Partial<OficinaRecord>): Observable<any> {
        return new Observable(observer => {
            this.http.put(`${this.apiUrl}/${id}`, record).subscribe({
                next: (res) => {
                    this.loadRecords();
                    observer.next(res);
                    observer.complete();
                },
                error: (err) => {
                    console.error('Error al actualizar oficina:', err);
                    observer.error(err);
                }
            });
        });
    }

    delete(id: string): Observable<any> {
        return new Observable(observer => {
            this.http.delete(`${this.apiUrl}/${id}`).subscribe({
                next: (res) => {
                    this.loadRecords();
                    observer.next(res);
                    observer.complete();
                },
                error: (err) => {
                    console.error('Error al eliminar oficina:', err);
                    observer.error(err);
                }
            });
        });
    }
}
