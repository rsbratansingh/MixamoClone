import { Component, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router'
import { PlaylistComponent } from './playlist/playlist.component';
import { AnimationComponent } from './animation/animation.component';
import { AnimationService } from './animation.service';
import { ApiService } from './services/api.service';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ListComponent } from './list/list.component';
import { NgxPaginationModule } from 'ngx-pagination';
const routes: Routes = [
  { path: '', redirectTo: "/animations", pathMatch: 'full' },
  { path: 'animations', component: AnimationComponent },
  { path: 'playlist', component: PlaylistComponent },
  { path: 'list', component: ListComponent },
  { path: '**', redirectTo: '/animations' }
]

@NgModule({
  declarations: [
    AppComponent,
    PlaylistComponent,
    AnimationComponent,
    ListComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxPaginationModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule
  ],
  providers: [AnimationService, ApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
