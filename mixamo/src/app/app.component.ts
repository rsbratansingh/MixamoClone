import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, createNgModule } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AnimationService } from './animation.service';
import { ApiService } from './services/api.service';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('container') container: ElementRef;
  playlist: any;
  myDiv: HTMLElement;
  constructor(private router: Router, private apiService: ApiService, public animationService: AnimationService, private cdr: ChangeDetectorRef) { }
  async ngOnInit() {
    await this.apiService.getPlaylist().then((res) => {
      this.playlist = res;
      console.log("Playlist ", res, this.playlist);
      this.cdr.detectChanges();
    }, (err) => {
      console.error("Error occured while getting data ", err);
    })
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        console.log('current Url', event.url);
        this.currentPageUrl = event.url;
        if (this.currentPageUrl == "/admin" || this.currentPageUrl == "/list") {
          this.showContainer = false;
          let cancelAnimation = true;
          this.pauseAnimation(cancelAnimation);
        }
        else {
          this.showContainer = true;
          // this.playAnimation();
        }
      })
  }
  ngAfterViewInit(): void {
    const width = this.container.nativeElement.clientWidth;
    const height = this.container.nativeElement.clientHeight;
    this.animationService.setContainer(this.container);
    this.animationService.initializScene();
  }

  title = 'mixamoClone';
  showContainer: boolean = true;
  currentPageUrl: any;
  selectedAnimation: any = "0";
  hasBothAnimations: boolean;
  selectedFormat: any = ".fbx";
  selectedFile: boolean = false;
  showModal: boolean = false;
  selectedExtension: any;
  extensions: any = [];
  keyword: any;
  isActive(url) {
    return this.router.url === url;
  }
  // ----------- Change Animation by Range -------------
  rangeValue: any = 0;

  onRangeChange(event: Event) {
    if (this.animationService.selectedFile) {
      if (this.rangeValue!==0) {
        console.log("range funciton called ");
        this.animationService.onRangeChange(this.rangeValue);
        this.rangeValue = 0;
      }
    }
  }
  // -----------search fucntion code from here  =========
  showCheckboxBox: boolean = false;
  checkboxHovered: boolean = false;
  timer: any;
  selectedCheckboxes: any = [];
  checkboxes: any = [{
    label: 'Adventure', checked: false,
    tags: ['Journey', 'Tour', 'Trek']
  },
  {
    label: 'Sport', checked: false,
    tags: ['Game', 'Play', 'Event']
  },
  {
    label: 'Dance', checked: false,
    tags: ['Dance', 'Reel']
  },
  {
    label: 'Horror', checked: false,
    tags: ['Fear', 'Terror', 'Panic']
  },
  {
    label: 'Superhero', checked: false,
    tags: ['Champion', 'Defender', 'Marvel', 'Superpower']
  }];
  setHideTimer() {
    console.log("setHideTImer called ")
    this.clearTimer();
    this.timer = setTimeout(() => {
      console.log(this.checkboxHovered, '&&', this.showCheckboxBox);
      if (this.checkboxHovered == false) { this.hideCheckbox(); }
    }, 500);
  }
  onSearch() {
    this.showCheckboxBox = true;
    const searchKeyword = this.animationService.getSearchKeyword();
    for (const checkbox of this.checkboxes) {
      checkbox.checked = searchKeyword.includes(checkbox.label);
    }
  }
  clearTimer() {
    console.log("clear timer called ")
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null;
    }
  }
  onCheckboxEnter() {
    console.log("checkbox mouse enter called ")
    if (this.showCheckboxBox) {
      this.checkboxHovered = true;
      this.clearTimer();
    }
  }
  hideCheckbox() {
    console.log("hide check box ", this.showCheckboxBox);
    setTimeout(() => {
      if (this.checkboxHovered == false) {
        console.log("hide checkbox called ")
        this.showCheckboxBox = false;
      }
    }, 500)
    console.log("hide check box ", this.showCheckboxBox);
  }
  onCheckboxLeave() {
    console.log("chekbox mouse leave called ")
    this.checkboxHovered = false;
    this.setHideTimer();
  }
  onCheckboxChange(event) {
    this.checkboxHovered = true;
    const newlySelectedCheckboxes = this.checkboxes
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.label);
    const checkbox = this.checkboxes.filter(checkbox => checkbox.checked);
    console.log("Newly selected checkboxes: ", newlySelectedCheckboxes, checkbox);
    this.selectedCheckboxes = this.selectedCheckboxes.filter(
      checkboxLabel => newlySelectedCheckboxes.includes(checkboxLabel));

    newlySelectedCheckboxes.forEach(element => {
      console.log("search called on the element ", element);
      // Check if the element is not already in the selectedCheckboxes array
      if (!this.selectedCheckboxes.includes(element)) {
        this.selectedCheckboxes.push(element); // Add the new word to the array
        this.animationService.search(element, '', checkbox[0].tags);
      }
    });

    const searchKeyword = this.animationService.getSearchKeyword();
    console.log("search keywords ", searchKeyword);
    // if checkbox is unchecked than remove this word from the search box
    const removeSelectedCheckbox = this.checkboxes.filter((checkbox) => !checkbox.checked).map((checkbox) => checkbox.label)
    console.log("remove checkbox words ", removeSelectedCheckbox);
    if (searchKeyword) {
      searchKeyword.forEach((word, i) => {
        if (removeSelectedCheckbox.includes(word)) {
          this.animationService.removeSearch(i, word);
          this.selectedCheckboxes.splice(i, 1);
        }
      })
    }
  }
  toggleFavourite() {
    if (!this.animationService.selectedFile) {
      alert("Please select file");
    }
    else {
      if (this.animationService.selectedFile.markFavourite) {
        this.animationService.removeFromFavourite();
        // this.animationService.selectedFile.markFavourite = false;
        console.log(this.animationService.selectedFile);
      } else {
        this.animationService.addToFavourites();
        // this.animationService.selectedFile.markFavourite = true;
        console.log(this.animationService.selectedFile);
      }
    }
  }
  onDropDownClick(extensionType: any) {
    this.selectedExtension = extensionType;
    console.log("dorpdown ", extensionType);
    this.animationService.onDropDownClick(extensionType);
  }
  search(keyword) {
    if (keyword) {
      let word = keyword.toLowerCase();
      if (this.selectedExtension !== 'all') {
        this.animationService.search(word, this.selectedExtension);
      } else {
        this.animationService.search(word);
      }
      this.keyword = null;
    }
    else return;
  }
  createDownloadDropdown() {
    console.log('second animation ', !(this.animationService.selectedFile?.isBothCharacterFile))
    if (this.animationService.bothCharacters == false) {
      this.extensions.push(...this.animationService.selectedFile.ext);
      console.log("extensions ", this.extensions);
      if (this.extensions.length <= 0) { this.extensions.push('.fbx') }
    }
    if (this.animationService.bothCharacters) {
      this.extensions.push(...this.animationService.selectedFile.files[0].ext);
      this.extensions.push(...this.animationService.selectedFile.files[1].ext);
      let ext = this.animationService.selectedFile.files[1].ext;
      ext.forEach((ext) => {
        if (!this.extensions?.includes(ext)) { this.extensions.push(ext); }
      })
      console.log("ext ", this.extensions);
      if (this.extensions.length <= 0) {
        console.log("fbx file path added ");
        this.extensions.push('.fbx')
      }
    }
    this.showModal = true;
  }
  downloadFile(formate: any, animation: any) {
    console.log('selected file formates ', formate, animation)
    if (!this.animationService.selectedFile) {
      this.selectedFile = false;
      alert("Please select file");
      return;
    }
    console.log("selected File ..", this.animationService.selectedFile.img);
    if (this.animationService.selectedFile.isBothCharacterFile) {
      console.log('isBothCharacterFile: ', this.animationService.selectedFile.isBothCharacterFile)
    }
    console.log(this.selectedAnimation, this.selectedFormat)
    this.animationService.download(formate, animation)
    this.showModal = false;
  }
  resetAnimation() {
    this.animationService.resetAnimation();
  }
  pauseAnimation(cancelAnimation?: boolean) {
    console.log("pause the animation ")
    this.animationService.pauseAnimation(cancelAnimation);
    console.log("pause the animation 2")
  }
  playAnimation() {
    this.animationService.playAnimation();
  }
  async addSelectedFile(id: any, listName: any, index: any) {
    const file = this.animationService.selectedFile;
    this.animationService.isFavourite = false;
    if (file) {
      if (listName == 'Favourites') {
        file.markFavourite = true; this.animationService.isFavourite = true;
        await this.apiService.updateFileFavourite(file._id, file.markFavourite).subscribe((res) => {
          console.log("file marked as favourites ", res)
        }, (err) => {
          console.error("Error occured cant add to favourites ", err);
        })
      }
      const res = await this.apiService.addDataToPlaylist(file, id).then((res) => {
        this.animationService.message = "File Added Successfully";
        this.animationService.success();
        if (this.playlist) {
          if (!this.playlist[index].files) {
            this.playlist[index].files = [];
          }
          if (file.isBothCharacterFile == true) {
            this.playlist[index].BothCharacters.push(file)
          }
          else
            this.playlist[index].files.push(file);
        }
        return res;
      },
        (err) => {
          this.animationService.message = "Error occured can't add file!"
          this.animationService.error();
          console.error("Error occured while adding Data", err);
        })
      console.log(res);
    } else { alert("no file selected!"); }
  }
}
