import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AnimationService } from '../animation.service';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api.service';
import { BothAnimation } from '../both-animation';

@Component({
  selector: 'app-animation',
  templateUrl: './animation.component.html',
  styleUrls: ['./animation.component.css']
})
export class AnimationComponent implements OnInit, OnDestroy {
  files: any[] = [];
  bothAnimationFiles: any[] = [];
  filesFromApi: any[] = []
  viewPlaylist: boolean;
  page: number = 1;
  tableSize: number = 20;
  fileSubscription: Subscription;
  bothAnimationSubscription: Subscription;
  searchKeyword: any[] = [];
  constructor(private apiSevice: ApiService, public animationService: AnimationService, private cdr: ChangeDetectorRef) {
    this.viewPlaylist = this.animationService.viewPlaylist;
    this.files = this.animationService.files;
    this.bothAnimationFiles = this.animationService.bothAnimationFiles;
  }
  async ngOnInit() {
    this.getAllFiles();
    console.log("this.files ", this.files);
  }
  async getAllFiles() {
    this.fileSubscription = await this.animationService.getFilteredAndSortedFiles().subscribe((filteredFiles) => {
      this.files = filteredFiles;
      if (this.animationService.query.length != 0)
        this.searchKeyword = this.animationService.getSearchKeyword();
      this.cdr.detectChanges();
    })
    this.bothAnimationSubscription = await this.animationService.getFilteredAndSortedBothFiles().subscribe((filteredFiles) => {
      this.bothAnimationFiles = filteredFiles;
      console.log("this.bothfiles ", this.bothAnimationFiles)
      if (this.animationService.query.length != 0)
        this.searchKeyword == this.animationService.getSearchKeyword();
      this.cdr.detectChanges();
    })
  }
  onPageChange(event: any) {
    this.page = event;
    this.getAllFiles();
  }
  onPageListChange(event: any) {
    this.tableSize = event.target.value;
    this.page = 1;
    this.getAllFiles();
  }
  getBothAnimationFiles(file) {
    let animation1;
    let animation2;
    console.log("Files ", file);
    for (let i = 0; i < 2; i++) {
      if (i == 0) animation1 = file.files[0];
      else animation2 = file.files[1];
    }
    if (this.clickCount === 0) {
      this.clickCount++;
      this.doubleclickTimeout = setTimeout(() => {
        this.clickCount = 0;
        this.animationService.selectedFile = file;
        this.animationService.sendToPreview(file);
      }, 700)
    }
    else {
      clearTimeout(this.doubleclickTimeout);
      this.clickCount = 0;
      this.animationService.selectedFile = file;
      this.animationService.sendToPreview(file);
    }
  }
  removeSearch(i) {
    let wordForRemove;
    if (this.animationService.bothCharacters == false) {
      console.log("search keyword ", this.searchKeyword)
      wordForRemove = this.searchKeyword[i];
      console.log("word that  is removed ", wordForRemove);
      this.searchKeyword.splice(i, 1);
    }
    this.animationService.removeSearch(i, wordForRemove);
  }
  generateRandomId() {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i <= 5; i++) {
      const index = Math.floor(Math.random() * charset.length)
      id += charset.charAt(index);
    }
    return id;
  }
  obj: BothAnimation = {
    name: null,
    id: null,
    markFavourite: false,
    isBothCharacterFile: false,
    img: null,
    files: [],
    tags: []
  };
  file1: any;
  file2: any;
  clickCount = 0;
  doubleclickTimeout: any;
  sendToPreview(file) {
    if (this.clickCount === 0) {
      this.clickCount++;
      this.doubleclickTimeout = setTimeout(() => {
        this.clickCount = 0;
        this.animationService.sendToPreview(file);
      }, 1000)
    }
    else {
      clearTimeout(this.doubleclickTimeout);
      this.clickCount = 0;
      this.animationService.sendToPreview(file);
    }
  }
  removeFromList(file) {
    this.animationService.removeFromList(file);
  }
  deleteSelectedList() {
    this.animationService.deleteSelectedList();
  }
  goToAnimation() {
    this.viewPlaylist = false;
    this.animationService.viewPlaylist = false;
  }
  ngOnDestroy(): void {
    if (this.fileSubscription) {
      this.fileSubscription.unsubscribe();
    }
    if (this.bothAnimationSubscription) {
      this.bothAnimationSubscription.unsubscribe();
    }
  }
}
