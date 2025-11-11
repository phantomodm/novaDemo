import { Component, input, inject } from '@angular/core';
import { ForecastService } from '../../core/services/forecast';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ForecastFeature } from '../../core/models/features.model';

@Component({
  selector: 'app-action-plan',
  imports: [
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './action-plan.html',
  styleUrl: './action-plan.css',
})
export class ActionPlan {
  private actionService = inject(ForecastService);
  public dialog: MatDialog = inject(MatDialog);
  selectedCell = input<ForecastFeature | null>(null);

  isGeneratingPlan = false;
  isSimulating = false;
  user = { tier: 'ci' }; // Placeholder user object
  constructor() {}
  /**
   * Called when the "Generate Action Plan" button is clicked
   */
  onGeneratePlan() {
    this.isGeneratingPlan = true;
    this.actionService.generateActionPlan().subscribe({
      next: (response:any) => {
        this.isGeneratingPlan = false;
        console.log('Plan generated:', response.plan);
        // TODO: Open a modal to display the plan
        // this.dialog.open(PlanViewerModalComponent, { data: response.plan });
        alert('Action Plan Generated: ' + response.plan.summary);
      },
      error: (err:any) => {
        this.isGeneratingPlan = false;
        // The API automatically sends a 403, which the auth interceptor
        // should handle. This just catches other errors.
        console.error('Error generating plan:', err);
        alert('Error: Could not generate plan. ' + err.error.detail);
      },
    });
  }

  /**
   * Called when the "Run 'What-if' Simulation" button is clicked
   */
  onRunSimulation() {
    if (!this.selectedCell) return;

    this.isSimulating = true;

    // Get coords from the cell's geometry
    // This assumes your selectedCell.geom is a Polygon
    const coords = this.selectedCell()?.geometry.coordinates[0][0];
    const lon = coords[0];
    const lat = coords[1];

    this.actionService.runSimulation(lat, lon, 7.5, 'tsunami').subscribe({
      next: (response:any) => {
        this.isSimulating = false;
        console.log('Simulation complete:', response);
        alert('Simulation Complete! Result URL (placeholder): ' + response.result_url);
      },
      error: (err:any) => {
        this.isSimulating = false;
        console.error('Error running simulation:', err);
        alert('Error: Could not run simulation. ' + err.error.detail);
      },
    });
  }
}
