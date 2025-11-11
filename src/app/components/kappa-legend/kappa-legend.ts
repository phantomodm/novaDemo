import { Component } from '@angular/core';
import { MatList, MatListItem } from "@angular/material/list";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-kappa-legend',
  imports: [MatList, MatListItem, MatIcon],
  templateUrl: './kappa-legend.html',
  styleUrl: './kappa-legend.css'
})
export class KappaLegend {
  legendItems = [
    { name: 'CRITICAL', class: 'status-critical', description: 'κ ≥ 1.25' },
    { name: 'ALERT', class: 'status-alert', description: 'κ ≥ 0.95 (Sustained 48h)' },
    { name: 'ADVISORY', class: 'status-advisory', description: 'κ ≥ 0.85' },
    { name: 'WATCH', class: 'status-watch', description: 'κ ≥ 0.75 & Rising' },
    { name: 'GREEN', class: 'status-green', description: 'κ < 0.75' }
  ];
}
