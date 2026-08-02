import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ControlOficinasCobaService, OficinaRecord, Responsable, HistorialPago, computeOficinaStatus } from '../service/control-oficinas-coba.service';

@Component({
    selector: 'app-control-oficinas-coba',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ButtonModule,
        ToastModule,
        ConfirmDialogModule,
        DrawerModule,
        DialogModule
    ],
    providers: [ConfirmationService, MessageService],
    template: `
<p-toast></p-toast>
<p-confirmDialog></p-confirmDialog>

<div class="p-6 min-h-screen bg-slate-50">

    <!-- Encabezado Principal -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
            <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                <i class="pi pi-building text-indigo-600 text-3xl"></i>
                Control Oficinas Coba
            </h1>
            <p class="text-slate-500 mt-1 text-sm font-medium">
                Gestión de oficinas, día de corte mensual e historial de pagos. Haz clic en el status de cualquier oficina para registrar pagos actuales o meses pasados.
            </p>
        </div>
        <button
            (click)="openAddDrawer()"
            class="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold shadow hover:shadow-md transition-all duration-150 flex items-center gap-2 transform active:scale-95 cursor-pointer">
            <i class="pi pi-plus font-bold"></i>
            Añadir Oficina
        </button>
    </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Oficinas</span>
            <span class="text-3xl font-black text-slate-800">{{ oficinas.length }}</span>
        </div>
        <div class="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-4 flex flex-col gap-1">
            <span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">Pagado</span>
            <span class="text-3xl font-black text-emerald-700">{{ getPagadasCount() }}</span>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4 flex flex-col gap-1">
            <span class="text-xs font-bold text-amber-600 uppercase tracking-wider">Pendiente (Antes del Corte)</span>
            <span class="text-3xl font-black text-amber-700">{{ getPendientesCount() }}</span>
        </div>
        <div class="bg-rose-50 rounded-xl border border-rose-200 shadow-sm p-4 flex flex-col gap-1">
            <span class="text-xs font-bold text-rose-500 uppercase tracking-wider">No Pagado / Atrasado</span>
            <span class="text-3xl font-black text-rose-700">{{ getAtrasadasCount() }}</span>
        </div>
    </div>

    <!-- Panel de Filtros Búsqueda -->
    <div class="mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div class="relative w-full sm:w-80">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    (ngModelChange)="applyFilters()"
                    placeholder="Buscar por oficina, responsable o puesto..."
                    class="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
            </div>
            <select
                [(ngModel)]="filterStatus"
                (change)="applyFilters()"
                class="border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="ALL">Todos los estatus</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="atrasado">No Pagado / Atrasado</option>
                <option value="finalizado">Contrato Finalizado</option>
            </select>
        </div>
        <button
            type="button"
            (click)="resetFilters()"
            class="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer">
            <i class="pi pi-refresh"></i> Limpiar filtros
        </button>
    </div>

    <!-- Tabla Principal de Oficinas -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-slate-700">
                <thead>
                    <tr class="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-xs uppercase font-extrabold tracking-wider">
                        <th class="py-4 px-6">Número de Oficina</th>
                        <th class="py-4 px-6">Nombre del Responsable</th>
                        <th class="py-4 px-6">Cuánto Paga</th>
                        <th class="py-4 px-6">Día Corte de Pago</th>
                        <th class="py-4 px-6">Status (Clic para Historial)</th>
                        <th class="py-4 px-6 text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-sm">
                    <tr *ngFor="let item of filteredOficinas"
                        [class.opacity-60]="item.status === 'finalizado'"
                        [class.bg-slate-100]="item.status === 'finalizado'"
                        [class.hover:bg-slate-200]="item.status === 'finalizado'"
                        [class.hover:bg-slate-50\/80]="item.status !== 'finalizado'"
                        class="transition-colors">
                        <!-- Número de Oficina -->
                        <td class="py-4 px-6 font-bold text-indigo-900">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-building text-indigo-500"></i>
                                <span>{{ item.numeroOficina }}</span>
                            </div>
                        </td>

                        <!-- Nombre del Responsable Principal -->
                        <td class="py-4 px-6">
                            <div class="font-bold text-slate-800">{{ item.responsablePrincipal.nombre || 'Sin asignar' }}</div>
                            <div class="text-xs text-slate-400 font-medium" *ngIf="item.responsablePrincipal.puesto">
                                {{ item.responsablePrincipal.puesto }}
                            </div>
                        </td>

                        <!-- Cuánto Paga -->
                        <td class="py-4 px-6 font-bold text-emerald-700">
                            {{ item.cuantoPaga | currency:'USD':'symbol':'1.2-2' }}
                        </td>

                        <!-- Día Corte de Pago -->
                        <td class="py-4 px-6 font-bold text-slate-700">
                            <div class="flex items-center gap-1.5">
                                <i class="pi pi-calendar-clock text-indigo-500"></i>
                                <span>{{ item.diaCortePago ? ('Día ' + item.diaCortePago) : 'Sin día' }}</span>
                            </div>
                        </td>

                        <!-- Status Interactivo con cálculo automático de mes -->
                        <td class="py-4 px-6">
                            <button
                                (click)="openStatusHistoryModal(item)"
                                title="Haz clic para registrar pagos de este mes o meses anteriores"
                                [ngClass]="getStatusBadgeClass(item.status)"
                                class="px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 hover:scale-105 active:scale-95 transition-all">
                                <span class="w-2 h-2 rounded-full" [ngClass]="getStatusDotClass(item.status)"></span>
                                <span>{{ getStatusLabel(item.status) }}</span>
                                <i class="pi pi-history text-xs opacity-75 ml-0.5"></i>
                            </button>
                        </td>

                        <!-- Acciones -->
                        <td class="py-4 px-6 text-center">
                            <div class="flex items-center justify-center gap-2">
                                <button
                                    (click)="openDetailModal(item)"
                                    title="Ver más información"
                                    class="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-all duration-150 border border-indigo-100 cursor-pointer flex items-center justify-center">
                                    <i class="pi pi-eye text-base"></i>
                                </button>
                                <button
                                    (click)="editOficina(item)"
                                    title="Editar información"
                                    class="bg-amber-50 text-amber-600 hover:bg-amber-100 p-2 rounded-lg transition-all duration-150 border border-amber-100 cursor-pointer flex items-center justify-center">
                                    <i class="pi pi-pencil text-base"></i>
                                </button>
                                <button
                                    (click)="deleteOficina(item)"
                                    title="Eliminar oficina"
                                    class="bg-rose-50 text-rose-600 hover:bg-rose-100 p-2 rounded-lg transition-all duration-150 border border-rose-100 cursor-pointer flex items-center justify-center">
                                    <i class="pi pi-trash text-base"></i>
                                </button>
                            </div>
                        </td>
                    </tr>

                    <tr *ngIf="filteredOficinas.length === 0">
                        <td colspan="6" class="py-12 px-6 text-center text-slate-400 font-medium">
                            <i class="pi pi-inbox text-4xl mb-2 text-slate-300 block"></i>
                            No se encontraron oficinas registradas.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- MODAL: HISTORIAL DE PAGOS Y CONTROL DE MESES -->
<p-dialog
    [(visible)]="statusModalVisible"
    [modal]="true"
    [style]="{ width: '90%', maxWidth: '750px' }"
    [draggable]="false"
    [resizable]="false">

    <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-xs">
                <i class="pi pi-history"></i>
            </span>
            <div>
                <h2 class="text-xl font-extrabold text-slate-800 leading-tight">
                    Historial de Pagos - {{ selectedOficinaForHistory?.numeroOficina }}
                </h2>
                <p class="text-xs text-slate-500 font-medium">
                    Registra o actualiza pagos de meses pasados o del mes actual.
                </p>
            </div>
        </div>
    </ng-template>

    <div *ngIf="selectedOficinaForHistory" class="flex flex-col gap-6 py-2">

        <!-- Resumen de Oficina seleccionada -->
        <div class="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
                <span class="text-xs text-slate-400 uppercase font-bold block">Responsable Principal</span>
                <span class="text-base font-extrabold text-white">{{ selectedOficinaForHistory.responsablePrincipal.nombre || 'Sin asignar' }}</span>
            </div>
            <div>
                <span class="text-xs text-slate-400 uppercase font-bold block">Cuota Mensual</span>
                <span class="text-base font-black text-emerald-400">{{ selectedOficinaForHistory.cuantoPaga | currency:'USD':'symbol':'1.2-2' }}</span>
            </div>
            <div>
                <span class="text-xs text-slate-400 uppercase font-bold block">Día Corte de Pago</span>
                <span class="text-base font-bold text-indigo-300">Día {{ selectedOficinaForHistory.diaCortePago || 'N/A' }} de c/mes</span>
            </div>
            <div>
                <span class="text-xs text-slate-400 uppercase font-bold block mb-1">Status Mes Actual</span>
                <span [ngClass]="getStatusBadgeClass(selectedOficinaForHistory.status)" class="px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" [ngClass]="getStatusDotClass(selectedOficinaForHistory.status)"></span>
                    {{ getStatusLabel(selectedOficinaForHistory.status) }}
                </span>
            </div>
        </div>

        <!-- Explicación amigable sobre la regla automática -->
        <div class="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <i class="pi pi-info-circle text-amber-600 text-base mt-0.5 shrink-0"></i>
            <div>
                <strong>Lógica Automática Mensual:</strong> Al inicio de cada mes el sistema coloca la oficina en <strong>PENDIENTE</strong> hasta que llegue el <strong>Día {{ selectedOficinaForHistory.diaCortePago || 'N/A' }}</strong>. Si no has registrado el pago antes de esa fecha, pasará automáticamente a <strong>NO PAGADO</strong>. Al registrar el pago como <strong>PAGADO</strong>, se mantendrá pagado en ese mes.
            </div>
        </div>

        <!-- Formulario para Registrar Pago de Mes Pasado o Actual -->
        <div class="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl flex flex-col gap-3">
            <h3 class="text-xs font-extrabold uppercase text-indigo-900 tracking-wider flex items-center gap-2">
                <i class="pi pi-plus-circle text-indigo-600"></i>
                Registrar Pago de Mes (Pasado o Actual)
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Mes y Año a Registrar *</label>
                    <input type="month" [(ngModel)]="newHistory.mesAnio"
                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Estatus para este Mes</label>
                    <select [(ngModel)]="newHistory.estatus"
                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500">
                        <option value="pagado">PAGADO (Se pagó en este mes)</option>
                        <option value="pendiente">PENDIENTE (Aún en tiempo)</option>
                        <option value="atrasado">NO PAGADO / ATRASADO</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Monto Pagado ($)</label>
                    <input type="number" [(ngModel)]="newHistory.montoPagado" placeholder="0.00" min="0" step="0.01"
                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Fecha en que realizó el pago</label>
                    <input type="date" [(ngModel)]="newHistory.fechaPago"
                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Notas / Folio / Método de Pago</label>
                    <input type="text" [(ngModel)]="newHistory.notas" placeholder="Ej. Transferencia SPEI Banco"
                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
            </div>

            <div class="flex justify-end pt-1">
                <button
                    type="button"
                    (click)="addHistoryRecord()"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm">
                    <i class="pi pi-save"></i>
                    Guardar Registro de Mes
                </button>
            </div>
        </div>

        <!-- Lista del Historial de Pagos -->
        <div class="flex flex-col gap-3">
            <h3 class="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                Historial de Meses Registrados ({{ selectedOficinaForHistory.historialPagos?.length || 0 }})
            </h3>

            <div *ngIf="!selectedOficinaForHistory.historialPagos || selectedOficinaForHistory.historialPagos.length === 0"
                class="p-6 rounded-2xl bg-slate-100/60 border border-slate-200 text-xs text-slate-400 text-center italic">
                No hay historial de pagos registrados aún para esta oficina. Usa el formulario de arriba para añadir meses anteriores.
            </div>

            <div *ngIf="selectedOficinaForHistory.historialPagos && selectedOficinaForHistory.historialPagos.length > 0"
                class="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table class="w-full text-left border-collapse text-slate-700 text-xs">
                    <thead>
                        <tr class="bg-slate-100 border-b border-slate-200 uppercase font-extrabold text-slate-600">
                            <th class="py-3 px-4">Mes / Año</th>
                            <th class="py-3 px-4">Estatus del Mes</th>
                            <th class="py-3 px-4">Monto Pagado</th>
                            <th class="py-3 px-4">Fecha Pago</th>
                            <th class="py-3 px-4">Notas</th>
                            <th class="py-3 px-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr *ngFor="let h of selectedOficinaForHistory.historialPagos; let i = index" class="hover:bg-slate-50">
                            <td class="py-3 px-4 font-extrabold text-slate-900">
                                {{ formatMonthYear(h.mesAnio) }}
                            </td>
                            <td class="py-3 px-4">
                                <span [ngClass]="getStatusBadgeClass(h.estatus)" class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1">
                                    {{ getStatusLabel(h.estatus) }}
                                </span>
                            </td>
                            <td class="py-3 px-4 font-bold text-emerald-700">
                                {{ h.montoPagado | currency:'USD':'symbol':'1.2-2' }}
                            </td>
                            <td class="py-3 px-4 text-slate-600 font-medium">
                                {{ h.fechaPago ? (h.fechaPago | date:'dd/MM/yyyy') : '—' }}
                            </td>
                            <td class="py-3 px-4 text-slate-500 max-w-xs truncate">
                                {{ h.notas || '—' }}
                            </td>
                            <td class="py-3 px-4 text-center">
                                <button
                                    type="button"
                                    (click)="deleteHistoryRecord(i)"
                                    title="Eliminar este mes del historial"
                                    class="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer">
                                    <i class="pi pi-trash text-xs"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

    </div>

    <ng-template pTemplate="footer">
        <div class="flex justify-end pt-3 border-t border-slate-200">
            <button
                type="button"
                (click)="statusModalVisible = false"
                class="px-5 py-2 text-xs font-extrabold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer">
                Cerrar
            </button>
        </div>
    </ng-template>
</p-dialog>

<!-- DRAWER: FORMULARIO AÑADIR / EDITAR OFICINA -->
<p-drawer
    [(visible)]="drawerVisible"
    position="right"
    [style]="{ width: '520px', background: '#f8fafc', borderLeft: '1px solid #e2e8f0' }"
    [modal]="true">
    
    <ng-template pTemplate="header">
        <div class="flex items-center gap-3 py-1">
            <span class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <i [class]="isEditing ? 'pi pi-pencil text-base' : 'pi pi-plus text-base'"></i>
            </span>
            <div>
                <div class="font-extrabold text-slate-800 text-base leading-tight">
                    {{ isEditing ? 'Editar Información de Oficina' : 'Añadir Nueva Oficina' }}
                </div>
                <div class="text-xs text-slate-500 font-medium">Control Oficinas Coba</div>
            </div>
        </div>
    </ng-template>

    <div class="flex flex-col gap-5 p-1 pb-6">
        <!-- Número de Oficina -->
        <div>
            <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Número de Oficina *</label>
            <input type="text" [(ngModel)]="formOficina.numeroOficina"
                placeholder="Ej. Oficina 101, A-202..."
                class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800 bg-white" />
        </div>

        <!-- Fecha de Inicio de Contrato & Día Corte de Pago -->
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Inicio de Contrato</label>
                <input type="date" [(ngModel)]="formOficina.fechaInicioContrato"
                    class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700 bg-white" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Día Corte de Pago *</label>
                <select [(ngModel)]="formOficina.diaCortePago"
                    class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-white">
                    <option value="">Seleccionar día...</option>
                    <option *ngFor="let day of daysList" [value]="day">Día {{ day }}</option>
                </select>
            </div>
        </div>

        <!-- Cuánto Paga & Status -->
        <div class="grid grid-cols-2 gap-3">
            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Cuánto Paga ($)</label>
                <input type="number" [(ngModel)]="formOficina.cuantoPaga"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-emerald-700 bg-white" />
            </div>
            <div>
                <label class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Estatus de Pago Manual</label>
                <select [(ngModel)]="formOficina.status"
                    class="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 bg-white">
                    <option value="pagado">Pagado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="atrasado">No Pagado / Atrasado</option>
                    <option value="finalizado">Contrato Finalizado</option>
                </select>
            </div>
        </div>

        <div class="border-t border-slate-200 my-1"></div>

        <!-- Responsable Principal -->
        <div class="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-3">
            <div class="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                <i class="pi pi-user-plus text-indigo-600"></i>
                Responsable Principal
            </div>

            <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Nombre Completo *</label>
                <input type="text" [(ngModel)]="formOficina.responsablePrincipal.nombre"
                    placeholder="Ej. Juan Carlos Pérez"
                    class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
            </div>

            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Puesto</label>
                    <input type="text" [(ngModel)]="formOficina.responsablePrincipal.puesto"
                        placeholder="Ej. Director General"
                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Número / Teléfono</label>
                    <input type="text" [(ngModel)]="formOficina.responsablePrincipal.numero"
                        placeholder="Ej. 998-123-4567"
                        class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
                </div>
            </div>
        </div>

        <!-- Más Responsables -->
        <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
                <label class="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Demás Responsables ({{ formOficina.responsablesAdicionales.length }})
                </label>
                <button
                    type="button"
                    (click)="addResponsableAdicional()"
                    class="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer">
                    <i class="pi pi-plus font-bold"></i> Agregar Responsable
                </button>
            </div>

            <div *ngIf="formOficina.responsablesAdicionales.length === 0" class="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-dashed border-slate-300 text-center">
                No hay responsables adicionales agregados. Presiona "+ Agregar Responsable" para colocar más.
            </div>

            <div *ngFor="let resp of formOficina.responsablesAdicionales; let i = index" class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col gap-2 relative group">
                <div class="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <span class="text-xs font-bold text-slate-500">Responsable Adicional #{{ i + 1 }}</span>
                    <button
                        type="button"
                        (click)="removeResponsableAdicional(i)"
                        title="Eliminar responsable"
                        class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer">
                        <i class="pi pi-trash text-xs"></i>
                    </button>
                </div>

                <div>
                    <input type="text" [(ngModel)]="resp.nombre"
                        placeholder="Nombre completo"
                        class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" [(ngModel)]="resp.puesto"
                        placeholder="Puesto (Ej. Gerente)"
                        class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    <input type="text" [(ngModel)]="resp.numero"
                        placeholder="Número / Teléfono"
                        class="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </div>
        </div>
    </div>

    <ng-template pTemplate="footer">
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
                type="button"
                (click)="drawerVisible = false"
                class="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                Cancelar
            </button>
            <button
                type="button"
                (click)="saveOficina()"
                class="px-5 py-2.5 text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2">
                <i class="pi pi-check"></i>
                {{ isEditing ? 'Guardar Cambios' : 'Registrar Oficina' }}
            </button>
        </div>
    </ng-template>
</p-drawer>

<!-- MODAL: FORMATO VER MÁS INFORMACIÓN -->
<p-dialog
    [(visible)]="detailModalVisible"
    [modal]="true"
    [style]="{ width: '90%', maxWidth: '640px' }"
    [draggable]="false"
    [resizable]="false"
    header="Detalle de Oficina">

    <ng-template pTemplate="header">
        <div class="flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                <i class="pi pi-building"></i>
            </span>
            <div>
                <h2 class="text-xl font-extrabold text-slate-800 leading-tight">
                    {{ selectedOficina?.numeroOficina }}
                </h2>
                <p class="text-xs text-slate-500 font-medium">Formato Completo de Información</p>
            </div>
        </div>
    </ng-template>

    <div *ngIf="selectedOficina" class="flex flex-col gap-6 py-2">

        <!-- Banner Encabezado Número de Oficina y Resumen Financiero -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                    <span class="text-xs font-bold text-indigo-300 uppercase tracking-widest block mb-1">Número de Oficina</span>
                    <span class="text-3xl font-black tracking-tight text-white">{{ selectedOficina.numeroOficina }}</span>
                </div>
                <div>
                    <span [ngClass]="getStatusBadgeClass(selectedOficina.status)" class="px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase inline-flex items-center gap-2 shadow-md">
                        <span class="w-2.5 h-2.5 rounded-full" [ngClass]="getStatusDotClass(selectedOficina.status)"></span>
                        {{ getStatusLabel(selectedOficina.status) }}
                    </span>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-700/60 relative z-10">
                <div>
                    <span class="text-xs text-slate-400 font-medium uppercase block">Inicio Contrato</span>
                    <span class="text-sm font-bold text-white mt-0.5 block">
                        {{ selectedOficina.fechaInicioContrato ? (selectedOficina.fechaInicioContrato | date:'dd/MM/yyyy') : 'Sin definir' }}
                    </span>
                </div>
                <div>
                    <span class="text-xs text-slate-400 font-medium uppercase block">Día Corte</span>
                    <span class="text-sm font-bold text-indigo-200 mt-0.5 block">
                        {{ selectedOficina.diaCortePago ? ('Día ' + selectedOficina.diaCortePago) : 'Sin día' }}
                    </span>
                </div>
                <div>
                    <span class="text-xs text-slate-400 font-medium uppercase block">Cuánto Paga</span>
                    <span class="text-sm font-black text-emerald-400 mt-0.5 block">
                        {{ selectedOficina.cuantoPaga | currency:'USD':'symbol':'1.2-2' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- SECCIÓN RESPONSABLES (Formato Especificado) -->
        <div class="flex flex-col gap-4">
            <h3 class="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                <i class="pi pi-users text-indigo-500"></i>
                Estructura de Responsables
            </h3>

            <!-- 1. RESPONSABLE PRINCIPAL -->
            <div class="bg-indigo-50/80 rounded-2xl border-2 border-indigo-200 p-5 shadow-xs">
                <div class="flex items-center gap-2 text-xs font-black text-indigo-700 uppercase tracking-wider mb-3">
                    <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                    Responsable Principal
                </div>

                <div class="flex flex-col gap-2">
                    <div>
                        <span class="text-xs text-slate-500 font-semibold block">Nombre del Responsable:</span>
                        <span class="text-base font-extrabold text-slate-900">
                            {{ selectedOficina.responsablePrincipal.nombre || 'Sin nombre registrado' }}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1 pt-2 border-t border-indigo-100">
                        <div>
                            <span class="text-xs text-slate-500 font-semibold block">Puesto:</span>
                            <span class="text-sm font-bold text-slate-700">
                                {{ selectedOficina.responsablePrincipal.puesto || 'No especificado' }}
                            </span>
                        </div>
                        <div>
                            <span class="text-xs text-slate-500 font-semibold block">Número / Teléfono:</span>
                            <span class="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                                <i class="pi pi-phone text-xs text-indigo-500"></i>
                                {{ selectedOficina.responsablePrincipal.numero || 'Sin teléfono' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 2. DEMÁS RESPONSABLES -->
            <div class="flex flex-col gap-3">
                <div class="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Demás Responsables ({{ selectedOficina.responsablesAdicionales?.length || 0 }})
                </div>

                <div *ngIf="!selectedOficina.responsablesAdicionales || selectedOficina.responsablesAdicionales.length === 0"
                    class="p-4 rounded-xl bg-slate-100/60 border border-slate-200 text-xs text-slate-400 text-center italic">
                    No se han registrado responsables adicionales para esta oficina.
                </div>

                <div *ngFor="let resp of selectedOficina.responsablesAdicionales; let i = index"
                    class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-2">
                    <div class="text-xs font-bold text-slate-400">Responsable Adicional #{{ i + 1 }}</div>
                    
                    <div>
                        <span class="text-xs text-slate-400 font-semibold block">Nombre:</span>
                        <span class="text-sm font-extrabold text-slate-800">{{ resp.nombre }}</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <div>
                            <span class="text-xs text-slate-400 font-semibold block">Puesto:</span>
                            <span class="text-xs font-bold text-slate-600">{{ resp.puesto || 'No especificado' }}</span>
                        </div>
                        <div>
                            <span class="text-xs text-slate-400 font-semibold block">Número / Teléfono:</span>
                            <span class="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <i class="pi pi-phone text-slate-400"></i>
                                {{ resp.numero || 'Sin teléfono' }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. HISTORIAL DE PAGOS REGISTRADOS -->
            <div class="flex flex-col gap-3 mt-2">
                <div class="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <i class="pi pi-history text-indigo-500"></i>
                    Historial de Pagos Registrados ({{ selectedOficina.historialPagos?.length || 0 }})
                </div>

                <div *ngIf="!selectedOficina.historialPagos || selectedOficina.historialPagos.length === 0"
                    class="p-4 rounded-xl bg-slate-100/60 border border-slate-200 text-xs text-slate-400 text-center italic">
                    No hay historial de pagos registrado.
                </div>

                <div *ngIf="selectedOficina.historialPagos && selectedOficina.historialPagos.length > 0" class="border border-slate-200 rounded-xl overflow-hidden">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 uppercase">
                                <th class="p-3">Mes / Año</th>
                                <th class="p-3">Estatus</th>
                                <th class="p-3">Monto Pagado</th>
                                <th class="p-3">Fecha Pago</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr *ngFor="let h of selectedOficina.historialPagos">
                                <td class="p-3 font-extrabold text-slate-800">{{ formatMonthYear(h.mesAnio) }}</td>
                                <td class="p-3">
                                    <span [ngClass]="getStatusBadgeClass(h.estatus)" class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                                        {{ getStatusLabel(h.estatus) }}
                                    </span>
                                </td>
                                <td class="p-3 font-bold text-emerald-700">{{ h.montoPagado | currency:'USD':'symbol':'1.2-2' }}</td>
                                <td class="p-3 text-slate-600">{{ h.fechaPago ? (h.fechaPago | date:'dd/MM/yyyy') : '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>

    <ng-template pTemplate="footer">
        <div class="flex justify-end pt-3 border-t border-slate-200">
            <button
                type="button"
                (click)="detailModalVisible = false"
                class="px-5 py-2 text-xs font-extrabold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer">
                Cerrar
            </button>
        </div>
    </ng-template>
</p-dialog>
    `
})
export class ControlOficinasCobaComponent implements OnInit {
    oficinas: OficinaRecord[] = [];
    filteredOficinas: OficinaRecord[] = [];

    searchQuery: string = '';
    filterStatus: string = 'ALL';

    drawerVisible: boolean = false;
    isEditing: boolean = false;
    editingId: string | null = null;

    detailModalVisible: boolean = false;
    selectedOficina: OficinaRecord | null = null;

    statusModalVisible: boolean = false;
    selectedOficinaForHistory: OficinaRecord | null = null;

    daysList: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

    formOficina = {
        numeroOficina: '',
        responsablePrincipal: {
            nombre: '',
            puesto: '',
            numero: ''
        },
        responsablesAdicionales: [] as Responsable[],
        cuantoPaga: 0,
        diaCortePago: '' as number | string,
        fechaInicioContrato: '',
        status: 'pagado' as 'pagado' | 'pendiente' | 'atrasado' | 'finalizado'
    };

    newHistory = {
        mesAnio: new Date().toISOString().substring(0, 7), // YYYY-MM
        estatus: 'pagado' as 'pagado' | 'pendiente' | 'atrasado',
        montoPagado: 0,
        fechaPago: new Date().toISOString().substring(0, 10),
        notas: ''
    };

    constructor(
        private oficinasService: ControlOficinasCobaService,
        private messageService: MessageService,
        private confirmationService: ConfirmationService
    ) {}

    ngOnInit(): void {
        this.oficinasService.getRecords().subscribe({
            next: (data) => {
                this.oficinas = data.map(o => ({
                    ...o,
                    status: computeOficinaStatus(o)
                }));
                this.applyFilters();
                if (this.selectedOficinaForHistory) {
                    const updated = this.oficinas.find(o => (o.id || o._id) === (this.selectedOficinaForHistory?.id || this.selectedOficinaForHistory?._id));
                    if (updated) {
                        this.selectedOficinaForHistory = updated;
                    }
                }
            }
        });
    }

    applyFilters(): void {
        let result = [...this.oficinas];

        if (this.searchQuery.trim()) {
            const q = this.searchQuery.toLowerCase().trim();
            result = result.filter(o =>
                o.numeroOficina.toLowerCase().includes(q) ||
                o.responsablePrincipal.nombre.toLowerCase().includes(q) ||
                o.responsablePrincipal.puesto.toLowerCase().includes(q) ||
                (o.responsablesAdicionales && o.responsablesAdicionales.some(r =>
                    r.nombre.toLowerCase().includes(q) ||
                    r.puesto.toLowerCase().includes(q)
                ))
            );
        }

        if (this.filterStatus === 'ALL') {
            // En "Todos los estatus" NO se muestran los finalizados
            result = result.filter(o => o.status !== 'finalizado');
        } else if (this.filterStatus === 'finalizado') {
            result = result.filter(o => o.status === 'finalizado');
        } else {
            // Para pagado/pendiente/atrasado, excluir finalizados
            result = result.filter(o => o.status === this.filterStatus && o.status !== 'finalizado');
        }

        this.filteredOficinas = result;
    }

    resetFilters(): void {
        this.searchQuery = '';
        this.filterStatus = 'ALL';
        this.applyFilters();
    }

    openAddDrawer(): void {
        this.isEditing = false;
        this.editingId = null;
        this.formOficina = {
            numeroOficina: '',
            responsablePrincipal: { nombre: '', puesto: '', numero: '' },
            responsablesAdicionales: [],
            cuantoPaga: 0,
            diaCortePago: '',
            fechaInicioContrato: '',
            status: 'pagado'
        };
        this.drawerVisible = true;
    }

    addResponsableAdicional(): void {
        this.formOficina.responsablesAdicionales.push({
            nombre: '',
            puesto: '',
            numero: ''
        });
    }

    removeResponsableAdicional(index: number): void {
        this.formOficina.responsablesAdicionales.splice(index, 1);
    }

    saveOficina(): void {
        if (!this.formOficina.numeroOficina.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campo Requerido',
                detail: 'Por favor ingresa el número de oficina.'
            });
            return;
        }

        if (!this.formOficina.responsablePrincipal.nombre.trim()) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campo Requerido',
                detail: 'Por favor ingresa el nombre del responsable principal.'
            });
            return;
        }

        const currentYearMonth = new Date().toISOString().substring(0, 7);

        // Calcular historialPagos base (en edición conservamos el existente)
        let baseHistorial: HistorialPago[] = [];
        if (this.isEditing && this.editingId) {
            const existing = this.oficinas.find(o => (o.id || o._id) === this.editingId);
            baseHistorial = existing?.historialPagos ? [...existing.historialPagos] : [];
        }

        // Si el status seleccionado es 'pagado', aseguramos una entrada para el mes actual
        if (this.formOficina.status === 'pagado') {
            const alreadyHas = baseHistorial.some(h => h.mesAnio === currentYearMonth);
            if (!alreadyHas) {
                baseHistorial.push({
                    mesAnio: currentYearMonth,
                    estatus: 'pagado',
                    montoPagado: Number(this.formOficina.cuantoPaga) || 0,
                    fechaPago: new Date().toISOString().substring(0, 10),
                    notas: 'Registrado al crear/editar oficina'
                });
            } else {
                // Si ya existe el mes, actualizamos su estatus a pagado
                baseHistorial = baseHistorial.map(h =>
                    h.mesAnio === currentYearMonth ? { ...h, estatus: 'pagado' } : h
                );
            }
        } else if (this.formOficina.status === 'finalizado') {
            // Contrato finalizado: conservar historial sin modificar
        } else {
            // Si el status es pendiente o atrasado, eliminamos la entrada del mes actual
            // para que computeOficinaStatus calcule el estado automáticamente
            baseHistorial = baseHistorial.filter(h => h.mesAnio !== currentYearMonth);
        }



        const payload: Omit<OficinaRecord, 'id' | '_id'> = {
            numeroOficina: this.formOficina.numeroOficina.trim(),
            responsablePrincipal: {
                nombre: this.formOficina.responsablePrincipal.nombre.trim(),
                puesto: this.formOficina.responsablePrincipal.puesto.trim(),
                numero: this.formOficina.responsablePrincipal.numero.trim()
            },
            responsablesAdicionales: this.formOficina.responsablesAdicionales.map(r => ({
                nombre: r.nombre.trim(),
                puesto: r.puesto.trim(),
                numero: r.numero.trim()
            })),
            cuantoPaga: Number(this.formOficina.cuantoPaga) || 0,
            diaCortePago: this.formOficina.diaCortePago || '',
            fechaInicioContrato: this.formOficina.fechaInicioContrato || '',
            status: this.formOficina.status,
            historialPagos: baseHistorial
        };

        if (this.isEditing && this.editingId) {
            this.oficinasService.update(this.editingId, payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Actualizado',
                        detail: 'Información de la oficina actualizada correctamente.'
                    });
                    this.drawerVisible = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar la oficina.'
                    });
                }
            });
        } else {
            this.oficinasService.create(payload).subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Registrado',
                        detail: 'Nueva oficina añadida correctamente.'
                    });
                    this.drawerVisible = false;
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo registrar la oficina.'
                    });
                }
            });
        }
    }


    editOficina(item: OficinaRecord): void {
        this.isEditing = true;
        this.editingId = item.id || item._id || null;
        this.formOficina = {
            numeroOficina: item.numeroOficina,
            responsablePrincipal: {
                nombre: item.responsablePrincipal.nombre || '',
                puesto: item.responsablePrincipal.puesto || '',
                numero: item.responsablePrincipal.numero || ''
            },
            responsablesAdicionales: item.responsablesAdicionales
                ? item.responsablesAdicionales.map(r => ({ ...r }))
                : [],
            cuantoPaga: item.cuantoPaga || 0,
            diaCortePago: item.diaCortePago || '',
            fechaInicioContrato: item.fechaInicioContrato || '',
            status: item.status || 'pagado'
        };
        this.drawerVisible = true;
    }

    openDetailModal(item: OficinaRecord): void {
        this.selectedOficina = item;
        this.detailModalVisible = true;
    }

    openStatusHistoryModal(item: OficinaRecord): void {
        this.selectedOficinaForHistory = item;
        this.newHistory = {
            mesAnio: new Date().toISOString().substring(0, 7),
            estatus: 'pagado',
            montoPagado: item.cuantoPaga || 0,
            fechaPago: new Date().toISOString().substring(0, 10),
            notas: ''
        };
        this.statusModalVisible = true;
    }

    addHistoryRecord(): void {
        if (!this.selectedOficinaForHistory) return;

        if (!this.newHistory.mesAnio) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Campo Requerido',
                detail: 'Por favor selecciona el mes y año.'
            });
            return;
        }

        const targetId = this.selectedOficinaForHistory.id || this.selectedOficinaForHistory._id;
        if (!targetId) return;

        const currentList = this.selectedOficinaForHistory.historialPagos || [];
        
        // Reemplazar o añadir el registro del mes indicado
        const updatedList = currentList.filter(h => h.mesAnio !== this.newHistory.mesAnio);
        
        const newRecord: HistorialPago = {
            mesAnio: this.newHistory.mesAnio,
            estatus: this.newHistory.estatus,
            montoPagado: Number(this.newHistory.montoPagado) || 0,
            fechaPago: this.newHistory.fechaPago || '',
            notas: this.newHistory.notas.trim()
        };

        updatedList.push(newRecord);
        updatedList.sort((a, b) => b.mesAnio.localeCompare(a.mesAnio));

        // Calcular el nuevo estado dinámico de la oficina
        const tempOficina: OficinaRecord = {
            ...this.selectedOficinaForHistory,
            historialPagos: updatedList
        };
        const calculatedStatus = computeOficinaStatus(tempOficina);

        const payload: Partial<OficinaRecord> = {
            historialPagos: updatedList,
            status: calculatedStatus
        };

        this.oficinasService.update(targetId, payload).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Pago Registrado',
                    detail: `Se guardó el pago para el mes de ${this.formatMonthYear(this.newHistory.mesAnio)}.`
                });
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo guardar el registro de pago.'
                });
            }
        });
    }

    deleteHistoryRecord(index: number): void {
        if (!this.selectedOficinaForHistory) return;
        const targetId = this.selectedOficinaForHistory.id || this.selectedOficinaForHistory._id;
        if (!targetId) return;

        const updatedList = [...(this.selectedOficinaForHistory.historialPagos || [])];
        updatedList.splice(index, 1);

        const tempOficina: OficinaRecord = {
            ...this.selectedOficinaForHistory,
            historialPagos: updatedList
        };
        const calculatedStatus = computeOficinaStatus(tempOficina);

        this.oficinasService.update(targetId, {
            historialPagos: updatedList,
            status: calculatedStatus
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Registro Eliminado',
                    detail: 'Se eliminó el mes del historial de pagos.'
                });
            }
        });
    }

    deleteOficina(item: OficinaRecord): void {
        const idToDelete = item.id || item._id;
        if (!idToDelete) return;

        this.confirmationService.confirm({
            message: `¿Estás seguro de que deseas eliminar la ${item.numeroOficina}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger p-button-sm',
            rejectButtonStyleClass: 'p-button-secondary p-button-sm',
            accept: () => {
                this.oficinasService.delete(idToDelete).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Eliminado',
                            detail: `La ${item.numeroOficina} ha sido eliminada.`
                        });
                    },
                    error: () => {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'No se pudo eliminar la oficina.'
                        });
                    }
                });
            }
        });
    }

    formatMonthYear(val: string): string {
        if (!val) return '—';
        const parts = val.split('-');
        if (parts.length === 2) {
            const year = parts[0];
            const monthNum = parseInt(parts[1], 10);
            const months = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            if (monthNum >= 1 && monthNum <= 12) {
                return `${months[monthNum - 1]} ${year}`;
            }
        }
        return val;
    }

    getPagadasCount(): number {
        return this.oficinas.filter(o => o.status === 'pagado').length;
    }

    getPendientesCount(): number {
        return this.oficinas.filter(o => o.status === 'pendiente').length;
    }

    getAtrasadasCount(): number {
        return this.oficinas.filter(o => o.status === 'atrasado').length;
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'pagado':
                return 'Pagado';
            case 'pendiente':
                return 'Pendiente';
            case 'atrasado':
                return 'No Pagado';
            case 'finalizado':
                return 'Contrato Finalizado';
            default:
                return status;
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'pagado':
                return 'bg-emerald-100 text-emerald-800 border border-emerald-300';
            case 'pendiente':
                return 'bg-amber-100 text-amber-800 border border-amber-300';
            case 'atrasado':
                return 'bg-rose-100 text-rose-800 border border-rose-300';
            case 'finalizado':
                return 'bg-slate-200 text-slate-500 border border-slate-300';
            default:
                return 'bg-slate-100 text-slate-700 border border-slate-300';
        }
    }

    getStatusDotClass(status: string): string {
        switch (status) {
            case 'pagado':
                return 'bg-emerald-500';
            case 'pendiente':
                return 'bg-amber-500';
            case 'atrasado':
                return 'bg-rose-500';
            case 'finalizado':
                return 'bg-slate-400';
            default:
                return 'bg-slate-400';
        }
    }
}
