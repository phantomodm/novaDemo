import { Component , inject, Inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SafeUrl } from '@angular/platform-browser';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

@Component({
  selector: 'app-chart',
  imports: [CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  ],
  templateUrl: './chart.html',
  styleUrl: './chart.css'
})
export class Chart {
  readonly dialogRef = inject(MatDialogRef<Chart>);
  readonly data: { plotUrl: SafeUrl } = inject<any>(MAT_DIALOG_DATA);
  
  constructor() { }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
