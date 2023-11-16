import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import { AnimationService } from '../animation.service';
import { Subscription } from 'rxjs';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css']
})
export class ListComponent {
  tags: any;
  constructor(private apiService: ApiService, private animationService: AnimationService, private cdr: ChangeDetectorRef) { }
  @ViewChild('fileInput') fileInput: ElementRef;
  @ViewChild('fileLocation') fileLocation: ElementRef;
  @ViewChild('BothAnimationFiles') bothAnimationFiles: ElementRef;
  @ViewChild('fileOption') fileOption: ElementRef;
  bothFiles: any[] = [];
  checkFiles: any[] = [];
  toggleBothAnimation: boolean = false;
  isBothAnimation: boolean = false;
  selectedFormat: any = "All";
  folderLocation: any;
  fileList: any;
  bothCharacterFiles: any;
  selectedFile: any
  searchKeyword: any[] = [];
  fileSubscription: Subscription;
  bothFileSubscription: Subscription;
  image: any = {};
  file: any = [];
  files: any = []
  imageFileValidator(control: AbstractControl): { [key: string]: any } | null {
    if (control.value) {
      const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'svg']; // Add more formats as needed
      const fileExtension = control.value.split('.').pop().toLowerCase();
      if (allowedFormats.indexOf(fileExtension) === -1) {
        return { invalidFormat: true };
      }
    }
    return null;
  }
  animationFileValidator(control: AbstractControl): { [key: string]: any } | null {
    if (control?.value) {
      const files: File[] = control.value as File[];
      if (!files) {
        return null;
      }
      const allowedFormats = ['fbx', 'glb', 'gltf', 'obj', 'iprop', 'iavtar', 'rlmotion', 'dae', 'stl', '3mf', 'ply', 'g-code', '3ds', 'step', 'vrml', 'iges', 'x3g', 'amf', 'stp'];
      for (const file of files) {
        const fileExtension = files.toString().split('.').pop().toLowerCase();
        if (allowedFormats.indexOf(fileExtension) === -1) {
          return { invalidFormat: true };
        }
      }
    }
    return null;
  }
  selectedFileForm = new FormGroup({
    name: new FormControl('', Validators.required),
    src: new FormControl([], this.animationFileValidator),
    tags: new FormControl([], Validators.required),
    img: new FormControl('', this.imageFileValidator)
  })
  async ngOnInit() {
    this.selectedFile = this.animationService.selectedFile;
    this.setValues(); //set values of the selected file
    this.fileSubscription = await this.animationService.getFilteredAndSortedFiles().subscribe((filteredFiles) => {
      this.fileList = filteredFiles;
      if (this.animationService.query.length != 0) {
        this.searchKeyword = this.animationService.getSearchKeyword()
      }
      this.cdr.detectChanges();
    })
    this.bothFileSubscription = await this.animationService.getFilteredAndSortedBothFiles().subscribe((filteredFiles) => {
      this.bothCharacterFiles = filteredFiles;
      if (this.animationService.query.length != 0) {
        this.searchKeyword = this.animationService.getSearchKeyword()
      }
      this.cdr.detectChanges();
    })
  }

  setValues() {
    // this.tags.length = 0;
    if (this.selectedFile) {
      console.log("set value called ")
      this.selectedFileForm.patchValue({
        name: this.selectedFile.name,
        // src: [],
        tags: this.selectedFile.tags,
        img: ''
      })
      console.log("data ", this.selectedFileForm.value);
    }
  }
addData(){
  // files should be added to the data base 
  let data=true;
  this.apiService.AddFilesBySrc(data).subscribe((res)=>{
    console.log("addData() data added successfully!! ",res)
  });
}
  getFolder() {
    this.fileLocation.nativeElement.style.display = "block";
    this.fileInput.nativeElement.click();
  }
  scan(format: any, location: any, isBothAnimation: any) {
    console.log("folder location ", location, "format ", format, isBothAnimation);
    location = location.replace(/\\/g, '/')
    let data = {
      path: location,
      format: format,
      isBothAnimation: isBothAnimation
    }
    this.apiService.addFiles({ data }).subscribe((req) => {
      console.log("data ", req)
      this.fileInput.nativeElement.style.display = "none";
      this.fileInput.nativeElement.value = null;
      this.selectedFormat = "All"
      this.folderLocation = null
      this.isBothAnimation = false;
    }, (err) => {
      console.error("error occured ", err)
    })
  }
  showAllFiles() {
    this.toggleBothAnimation = false;
  }
  onCheckboxChanged(list: any) {
    if(!list.selectedOptions.selected.length){
      console.log("reset the form ")
      this.selectedFileForm.reset();
      this.selectedFile=undefined;
    }
    let bothFiles = list.selectedOptions.selected.map(item => item.value);
    this.selectedFile = bothFiles[bothFiles.length - 1]; //so that i can get the latest file in the selectedfile
    console.log("selected ", this.selectedFile);
    this.setValues();
    this.bothFiles = bothFiles;
    console.log("both files ", bothFiles);
  }
  showBothAnimationFiles() {
    this.toggleBothAnimation = true;
    console.log("Both Character files ", this.bothCharacterFiles);
    console.log("both files ", this.bothFiles);
  }
  bothFileImage: any;
  mergeFiles() {
    if (this.bothFiles.length > 1) {
      console.log("merge called ")
      if (this.bothFileImage !== null || this.bothFileImage !==undefined || this.bothFileImage !=='') {
        console.log("image for merge file ", this.bothFileImage);
        this.bothFiles.push({ image: this.bothFileImage }) //it means user select the new image for merge file
        console.log("both file after image ", this.bothFiles);
        this.bothFileImage = '';
      }
      this.apiService.mergeFiles({ data: this.bothFiles }).subscribe((res) => {
        console.log("File merged successfully ", res)
        this.animationService.message = "File merged successfully ✔";
        this.animationService.success();
        this.selectedFileForm.reset();
        this.bothFiles = [];
        this.selectedFile = undefined;
      }, (err) => {
        this.animationService.message = "Error occured! can't merge files";
        this.animationService.error();
        console.error("Error occured while merging data ", err);
      })
    }
  }
  selectImage(event: any) {
    if (this.selectedFile?.img!==''&&this.selectedFile?.img!==undefined&&this.selectedFile?.img!==null && this.bothFiles.length == 1) {
      if (confirm("Want to replace old image!")) {
        if (event.target.value) {
          this.image = <File>event.target.files[0];
          console.log("image ", this.image.name);
        }
      }
    }
    else if (this.selectedFile?.img && this.bothFiles.length > 1) {  //It means user select image for both files before merging files
      if (event.target.value) {
        this.image = <File>event.target.files[0];
        this.bothFileImage = <File>event.target.files[0];
        console.log("image for merging file ", this.image.name);
      }
    }
    else {
      if (event.target.value) {
        this.image = <File>event.target.files[0];
      }
    }
  }
  selectFile(event: any) {
    if (event.target.value) {
      this.file.push(<File>event.target.files[0]);
    }
  }

  isSrcControlEmpty(): boolean {
    const srcControl = this.selectedFileForm.get('src');
    return !srcControl.value || srcControl.value.toString().trim() === '';
  }
  uploadFile() {
    // this.selectedFileForm.patchValue({ "tags": this.tags });
    console.log("new Data", this.selectedFileForm.value);
    let formData = new FormData();
    console.log("this. files ", this.files);
    let name = this.selectedFileForm.get('name').value
    formData.append('name', name);
    const tags = this.selectedFileForm.get("tags").value;
    formData.append('tags', tags.toString());
    if (this.image) {
      formData.append('img', this.image);
    }
    if (this.files.length > 0) {
      for (let i = 0; i < this.files.length; i++) {
        console.log('File', i, ':', this.files[i]);
        formData.append('src', this.files[i]);
      }
      formData.append('src', this.file[0]);
    } else {
      formData.append('src', this.file[0]);
    }
    this.apiService.addNewFile(formData).subscribe((res: any) => {
      this.animationService.message = "Data updated successfully"
      this.animationService.success();
      // reset all values
      this.selectedFileForm.reset();
      this.selectedFile = undefined;
      if (res) {
        if (res) {
          this.apiService.getData().subscribe((res) => {
            this.animationService.files = res; //update files 
            this.animationService.filteredFiles.next(this.animationService.files.slice()) //update behaviour subject filtered files 
            this.animationService.query.length = 0; //remove all search queries 
          }, (err) => {
            console.error("Error occured while updating data ", err);
          })
        }
      }
    }, (err) => {
      console.error("Erorr occured whil adding data ", err)
      this.animationService.message = "Error occured while adding data...";
      this.animationService.error();
    })
  }
  onSubmit() {
    console.log("submit called ")
    console.log(this.selectedFileForm.value);
    if (this.selectedFileForm.valid) {
      let tag = this.selectedFileForm.get('tags').value;
      console.log("submit called ", tag, tag.toString())
      let formData = new FormData();
      const id = this.selectedFile._id;
      // let tagsArr = this.selectedFileForm.get('tags').value
      // let newTags = tagsArr.toString().split(',')
      // console.log('tags Array ', newTags);
      console.log("this. files ", this.files);
      let fileStr = this.files.toString();
      let name = this.selectedFileForm.get('name').value;
      console.log("name ", name);
      formData.append('name', name);
      formData.append('tags', tag.toString());
      // formData.append('tags', this.tags.toString());
      if (this.image) {
        formData.append('img', this.image);
      }
      if (this.files.length > 0) {
        for (let i = 0; i < this.files.length; i++) {
          console.log('File', i, ':', this.files[i]);
          formData.append('src', this.files[i]);
        }
        formData.append('src', this.file[0]);
      } else {
        formData.append('src', this.file[0]);
      }
      console.log("formData ", JSON.stringify(formData));
      this.apiService.updateFileData(id, formData).subscribe((res: any) => {
        this.animationService.message = "Data updated successfully"
        this.animationService.success();
        this.bothFiles = [];
        // reset the form data 
        this.selectedFileForm.reset();
        this.selectedFile = undefined;
        if (res) {
          this.apiService.getData().subscribe((res) => {
            this.animationService.files = res; //update files 
            this.animationService.filteredFiles.next(this.animationService.files.slice()) //update behaviour subject filtered files 
            this.animationService.query.length = 0; //remove all search queries 
          }, (err) => {
            console.error("Error occured while updating data")
          })
        }
        console.log("Data updated ", res);
      }, (err: any) => {
        this.animationService.message = "Error occure while updating data..."
        console.error("Error occured while editing data ", err);
      })
    }
    else {
      this.animationService.message = "Form data is invalid";
      this.animationService.error();
    }
  }
}
