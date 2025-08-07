import { Location } from '@angular/common';
import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-goback',
    templateUrl: './goback.component.html',
    styleUrls: ['./goback.component.scss'],
})
export class GobackComponent {
    constructor(private location: Location) { }
    goBack(): void {
        this.location.back();
    }
}