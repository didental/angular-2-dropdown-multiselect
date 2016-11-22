/*
 * Angular 2 Dropdown Multiselect for Bootstrap
 * Current version: 0.3.2
 *
 * Simon Lindh
 * https://github.com/softsimon/angular-2-dropdown-multiselect
 */

import {
    NgModule,
    Component,
    Pipe,
    OnInit,
    DoCheck,
    HostListener,
    Input,
    ElementRef,
    Output,
    EventEmitter,
    forwardRef,
    IterableDiffers
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

const MULTISELECT_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => MultiselectDropdown),
    multi: true
};

export interface IMultiSelectOptGroup {
    groupName: String;
    opts: Array<IMultiSelectOption>;
}

export interface IMultiSelectOption {
    id: number;
    name: string;
}

export interface IMultiSelectSettings {
    pullRight?: boolean;
    enableSearch?: boolean;
    checkedStyle?: 'checkboxes' | 'glyphicon';
    buttonClasses?: string;
    selectionLimit?: number;
    closeOnSelect?: boolean;
    autoUnselect?: boolean;
    showCheckAll?: boolean;
    showUncheckAll?: boolean;
    dynamicTitleMaxItems?: number;
    maxHeight?: string;
}

export interface IMultiSelectTexts {
    checkAll?: string;
    uncheckAll?: string;
    checked?: string;
    checkedPlural?: string;
    searchPlaceholder?: string;
    defaultTitle?: string;
}

@Pipe({
    name: 'searchFilter'
})
export class MultiSelectSearchFilter {
    transform(options: Array<IMultiSelectOption>, args: string): Array<IMultiSelectOption> {

        return options.filter((option: IMultiSelectOption) => option.name.toLowerCase().indexOf((args || '').toLowerCase()) > -1);
    }
}

@Component({
    moduleId: module.id,
    selector: 'ss-multiselect-dropdown',
    providers: [MULTISELECT_VALUE_ACCESSOR],
    styleUrls: ['bootstrap.css', 'bootstrap-multiselect.css'],
    template: `
        <div class="btn-group">
            <button type="button" class="dropdown-toggle" [ngClass]="settings.buttonClasses" 
            (click)="toggleDropdown()">{{ title }}&nbsp;<span class="caret"></span></button>
            <ul *ngIf="isVisible" class="dropdown-menu" [class.pull-right]="settings.pullRight" 
            [style.max-height]="settings.maxHeight" style="display: block; height: auto; overflow-y: auto;">
                <li style="margin: 0px 5px 5px 5px;" *ngIf="settings.enableSearch">
                    <div class="input-group input-group-sm">
                        <span class="input-group-addon" id="sizing-addon3"><i class="fa fa-search"></i></span>
                        <input type="text" class="form-control" placeholder="{{ texts.searchPlaceholder }}" 
                        aria-describedby="sizing-addon3" [(ngModel)]="searchFilterText">
                        <span class="input-group-btn" *ngIf="searchFilterText.length > 0">
                            <button class="btn btn-default" type="button" (click)="clearSearch()"><i class="fa fa-times"></i></button>
                        </span>
                    </div>
                </li>
                <li class="divider" *ngIf="settings.enableSearch"></li>
                <li *ngIf="settings.showCheckAll">
                    <a href="javascript:;" role="menuitem" tabindex="-1" (click)="checkAll()">
                        <span style="width: 16px;" class="glyphicon glyphicon-ok"></span>
                        {{ texts.checkAll }}
                    </a>
                </li>
                <li *ngIf="settings.showUncheckAll">
                    <a href="javascript:;" role="menuitem" tabindex="-1" (click)="uncheckAll()">
                        <span style="width: 16px;" class="glyphicon glyphicon-remove"></span>
                        {{ texts.uncheckAll }}
                    </a>
                </li>
                <li *ngIf="settings.showCheckAll || settings.showUncheckAll" class="divider"></li>
                <template ngFor let-group="$implicit" [ngForOf]="options" let-i="index">
                    <template [ngIf]="group.groupName">
                        <li class="multiselect-item multiselect-group">
                            <a href="javascript:void(0);" (click)="hideGroup($event, group.groupName)">
                                <label><b> {{ group.groupName.toUpperCase() }}</b></label>
                                <span class="caret-container"><b class="caret"></b></span>
                            </a>
                        </li>
                    </template>
                    <template [ngIf]="!isHiddenGroup(group.groupName)">
                        <li *ngFor="let option of group.opts | searchFilter:searchFilterText">
                            <a href="javascript:;" role="menuitem" tabindex="-1" (click)="setSelected($event, option)">
                                <input *ngIf="settings.checkedStyle == 'checkboxes'" type="checkbox" [checked]="isSelected(option)" />
                                <span *ngIf="settings.checkedStyle == 'glyphicon'" style="width: 16px;" 
                                class="glyphicon" [class.glyphicon-ok]="isSelected(option)"></span>
                                {{ option.name }}
                            </a>
                        </li>
                    </template>
                </template>
            </ul>
        </div>
    `
})
export class MultiselectDropdown implements OnInit, DoCheck, ControlValueAccessor {

    @Input() options: Array<IMultiSelectOptGroup | IMultiSelectOption>;
    @Input() settings: IMultiSelectSettings;
    @Input() texts: IMultiSelectTexts;
    @Output() selectionLimitReached = new EventEmitter();

    @HostListener('document: click', ['$event.target'])
    onClick(target: HTMLElement) {
        let parentFound = false;
        while (target != null && !parentFound) {
            if (target === this.element.nativeElement) {
                parentFound = true;
            }
            target = target.parentElement;
        }
        if (!parentFound) {
            this.isVisible = false;
        }
    }

    optionsWithoutGroup: Array<IMultiSelectOption>;
    onModelChange: Function = (_: any) => {
    };
    onModelTouched: Function = () => {
    };
    model: number[];
    title: string;
    differ: any;
    numSelected: number = 0;
    isVisible: boolean = false;
    searchFilterText: string = '';
    defaultSettings: IMultiSelectSettings = {
        pullRight: false,
        enableSearch: false,
        checkedStyle: 'checkboxes',
        buttonClasses: 'btn btn-default',
        selectionLimit: 0,
        closeOnSelect: false,
        autoUnselect: false,
        showCheckAll: false,
        showUncheckAll: false,
        dynamicTitleMaxItems: 3,
        maxHeight: '300px',
    };
    defaultTexts: IMultiSelectTexts = {
        checkAll: 'Check all',
        uncheckAll: 'Uncheck all',
        checked: 'checked',
        checkedPlural: 'checked',
        searchPlaceholder: 'Search...',
        defaultTitle: 'Select',
    };
    hiddenGroup: string[] = [];
    constructor(private element: ElementRef,
        private differs: IterableDiffers) {
        this.differ = differs.find([]).create(null);
    }

    ngOnInit() {
        this.settings = Object.assign(this.defaultSettings, this.settings);
        this.texts = Object.assign(this.defaultTexts, this.texts);
        this.title = this.texts.defaultTitle;

        // if options type is IMultiSelectOption...
        if (!Object.keys(this.options[0]).includes("groupName")) {
            let newOpts = [{
                groupName: undefined,
                opts: this.options.map((value: IMultiSelectOption) => {
                    return value;
                })
            }];
            this.options = newOpts;
        }

        this.optionsWithoutGroup = this.options.reduce((prev: Array<IMultiSelectOption>, curr: IMultiSelectOptGroup) => { return prev.concat(curr.opts); }, []);
    }

    writeValue(value: any): void {
        if (value !== undefined) {
            this.model = value;
        }
    }

    registerOnChange(fn: Function): void {
        this.onModelChange = fn;
    }

    registerOnTouched(fn: Function): void {
        this.onModelTouched = fn;
    }

    ngDoCheck() {
        let changes = this.differ.diff(this.model);
        if (changes) {
            this.updateNumSelected();
            this.updateTitle();
        }
    }

    clearSearch() {
        this.searchFilterText = '';
    }

    toggleDropdown() {
        this.isVisible = !this.isVisible;
    }

    isSelected(option: IMultiSelectOption): boolean {
        return this.model && this.model.indexOf(option.id) > -1;
    }

    setSelected(event: Event, option: IMultiSelectOption) {
        if (!this.model) {
            this.model = [];
        }
        var index = this.model.indexOf(option.id);
        if (index > -1) {
            this.model.splice(index, 1);
        } else {
            if (this.settings.selectionLimit === 0 || this.model.length < this.settings.selectionLimit) {
                this.model.push(option.id);
            } else {
                if (this.settings.autoUnselect) {
                    this.model.push(option.id);
                    this.model.shift();
                } else {
                    this.selectionLimitReached.emit(this.model.length);
                    return;
                }
            }
        }
        if (this.settings.closeOnSelect) {
            this.toggleDropdown();
        }
        this.onModelChange(this.model);
    }

    hideGroup(event: Event, groupName: string) {
        if (this.isHiddenGroup(groupName))
            this.hiddenGroup.splice(this.hiddenGroup.indexOf(groupName), 1);
        else
            this.hiddenGroup.push(groupName);
    }

    isHiddenGroup(groupName: string): boolean {
        return this.hiddenGroup.includes(groupName);
    }

    updateNumSelected() {
        this.numSelected = this.model && this.model.length || 0;
    }

    updateTitle() {
        if (this.numSelected === 0) {
            this.title = this.texts.defaultTitle;
        } else if (this.settings.dynamicTitleMaxItems >= this.numSelected) {
            this.title = this.optionsWithoutGroup
                .filter((option: IMultiSelectOption) => this.model && this.model.indexOf(option.id) > -1)
                .map((option: IMultiSelectOption) => option.name)
                .join(', ');
        } else {
            this.title = this.numSelected + ' ' + (this.numSelected === 1 ? this.texts.checked : this.texts.checkedPlural);
        }
    }

    checkAll() {
        this.model = this.optionsWithoutGroup.map(option => option.id);
        this.onModelChange(this.model);
    }

    uncheckAll() {
        this.model = [];
        this.onModelChange(this.model);
    }
}

@NgModule({
    imports: [CommonModule, FormsModule],
    exports: [MultiselectDropdown],
    declarations: [MultiselectDropdown, MultiSelectSearchFilter],
})
export class MultiselectDropdownModule {
}
