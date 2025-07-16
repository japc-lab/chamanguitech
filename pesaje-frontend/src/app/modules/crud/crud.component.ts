import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  NgbModal,
  NgbModalOptions,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { DataTableDirective } from 'angular-datatables';
import { fromEvent } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { SweetAlertOptions } from 'sweetalert2';
import { Api, Config } from 'datatables.net';
import { PermissionService } from '../shared/services/permission.service';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';

@Component({
  selector: 'app-crud',
  templateUrl: './crud.component.html',
  styleUrls: ['./crud.component.scss'],
})
export class CrudComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() datatableConfig: Config = {};

  @Input() route: string = '/';

  @Input() permissionRoute: string = '/';

  @Input() isExternalModal: boolean = false;

  // Reload emitter inside datatable
  @Input() reload: EventEmitter<boolean>;

  @Input() modal: TemplateRef<any>;

  @Output() deleteEvent = new EventEmitter<number>();
  @Output() editEvent = new EventEmitter<number>();
  @Output() createEvent = new EventEmitter<boolean>();

  dtOptions: Config = {};

  @ViewChild(DataTableDirective, { static: false })
  private datatableElement: DataTableDirective;

  @ViewChild('deleteSwal')
  public readonly deleteSwal!: SwalComponent;

  @ViewChild('successSwal')
  public readonly successSwal!: SwalComponent;

  private idInAction: number;

  modalConfig: NgbModalOptions = {
    modalDialogClass: 'modal-dialog modal-dialog-centered mw-650px',
  };

  swalOptions: SweetAlertOptions = { buttonsStyling: false };
  confirmDeleteTitle = '';
  confirmDeleteText = '';
  deleteSuccessTitle = '';

  private modalRef: NgbModalRef;

  private clickListener: () => void;

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private modalService: NgbModal,
    private translate: TranslateService,
    private permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    this.loadTranslations(); // Load initially

    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.loadTranslations(); // Reload on language change
    });

    this.dtOptions = {
      dom:
        "<'row'<'col-sm-12'tr>>" +
        "<'d-flex justify-content-between'<'col-sm-12 col-md-5'i><'d-flex justify-content-between'p>>",
      processing: true,
      language: {
        processing:
          '<span class="spinner-border spinner-border-sm align-middle"></span> Loading...',
      },
      ...this.datatableConfig,
    };

    this.renderActionColumn();

    // this.setupSweetAlert();

    // if (this.reload) {
    //   this.reload.subscribe(data => {
    //     this.modalService.dismissAll();
    //     this.datatableElement.dtInstance.then((dtInstance: Api) => dtInstance.ajax.reload());
    //   });
    // }

    if (this.reload) {
      this.reload.subscribe((data) => {
        if (!this.isExternalModal) this.modalService.dismissAll();

        this.datatableElement.dtInstance?.then((dtInstance: Api) => {
          if (this.datatableConfig.serverSide) {
            dtInstance.ajax.reload(); // ✅ Reload via AJAX (server-side)
          } else {
            if (data) {
              dtInstance
                .clear()
                .rows.add(this.datatableConfig.data || [])
                .draw();
            }
          }
        });
      });
    }
  }

  renderActionColumn(): void {
    const actionColumn = {
      sortable: false,
      title: 'Acciones',
      render: (data: any, type: any, full: any) => {
        const editButton = !this.isExternalModal
          ? `
          <button class="btn btn-icon btn-active-light-primary w-30px h-30px me-3" data-action="edit" data-id="${full.id}">
            <i class="ki-duotone ki-pencil fs-3"><span class="path1"></span><span class="path2"></span></i>
          </button>`
          : `
          <button class="btn btn-icon btn-active-light-primary w-30px h-30px me-3" data-action="edit-out" data-id="${full.id}">
            <i class="ki-duotone ki-pencil fs-3"><span class="path1"></span><span class="path2"></span></i>
          </button>`;

        const deleteButton = `
          <button class="btn btn-icon btn-active-light-primary w-30px h-30px" data-action="delete" data-id="${full.id}">
            <i class="ki-duotone ki-trash fs-3">
              <span class="path1"></span><span class="path2"></span>
              <span class="path3"></span><span class="path4"></span><span class="path5"></span>
            </i>
          </button>`;

        const buttons = [];

        if (
          this.editEvent.observed &&
          this.permissionService.canEdit(this.permissionRoute)
        ) {
          buttons.push(editButton);
        }

        if (
          this.deleteEvent.observed &&
          this.permissionService.canDelete(this.permissionRoute)
        ) {
          buttons.push(deleteButton);
        }

        return buttons.join('');
      },
    };

    if (this.dtOptions.columns) {
      this.dtOptions.columns.push(actionColumn);
    }
  }

  ngAfterViewInit(): void {
    this.clickListener = this.renderer.listen(document, 'click', (event) => {
      const closestBtn = event.target.closest('.btn');
      if (closestBtn) {
        const { action, id } = closestBtn.dataset;
        this.idInAction = id;

        switch (action) {
          case 'view':
            this.router.navigate([`${this.route}/${id}`]);
            break;

          case 'create':
            this.createEvent.emit(true);
            this.modalRef = this.modalService.open(
              this.modal,
              this.modalConfig
            );
            break;

          case 'edit':
            this.editEvent.emit(this.idInAction);
            if (!this.isExternalModal) {
              this.modalRef = this.modalService.open(
                this.modal,
                this.modalConfig
              );
            }
            break;

          case 'edit-out':
            this.editEvent.emit(this.idInAction);
            break;

          case 'delete':
            this.deleteSwal.fire().then((clicked) => {
              if (clicked.isConfirmed) {
                this.successSwal.fire();
              }
            });
            break;
        }
      }
    });

    this.triggerFilter();
  }

  ngOnDestroy(): void {
    this.reload.unsubscribe();
    if (this.clickListener) {
      this.clickListener();
    }
    this.modalService.dismissAll();
  }

  triggerDelete() {
    this.deleteEvent.emit(this.idInAction);
  }

  triggerFilter() {
    fromEvent<KeyboardEvent>(document, 'keyup')
      .pipe(
        debounceTime(50),
        map((event) => {
          const target = event.target as HTMLElement;
          const action = target.getAttribute('data-action');
          const value = (target as HTMLInputElement).value
            ?.trim()
            .toLowerCase();

          return { action, value };
        })
      )
      .subscribe(({ action, value }) => {
        if (action === 'filter') {
          this.datatableElement.dtInstance.then((dtInstance: Api) =>
            dtInstance.search(value).draw()
          );
        }
      });
  }

  loadTranslations(): void {
    this.translate
      .get([
        'MESSAGES.DELETE_CONFIRM_TITLE',
        'MESSAGES.DELETE_CONFIRM_TEXT',
        'MESSAGES.DELETE_SUCCESS',
        'BUTTONS.OK',
        'BUTTONS.CANCEL',
      ])
      .subscribe((translations) => {
        this.confirmDeleteTitle = translations['MESSAGES.DELETE_CONFIRM_TITLE'];
        this.confirmDeleteText = translations['MESSAGES.DELETE_CONFIRM_TEXT'];
        this.deleteSuccessTitle = translations['MESSAGES.DELETE_SUCCESS'];

        this.swalOptions = {
          buttonsStyling: false,
          confirmButtonText: translations['BUTTONS.OK'],
          cancelButtonText: translations['BUTTONS.CANCEL'],
        };
      });
  }

  // setupSweetAlert() {
  //   this.swalOptions = {
  //     buttonsStyling: false,
  //   };
  // }
}
