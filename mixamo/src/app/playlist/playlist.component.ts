import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AnimationService } from '../animation.service';
import { ApiService } from '../services/api.service';
// import Swal from 'sweetalert2';
declare var Swal: any;
// import {MatDialog, MAT_DIALOG_DATA, MatDialogRef, MatDialogModule} from '@angular/material/dialog'
@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.component.html',
  styleUrls: ['./playlist.component.css']
})
export class PlaylistComponent implements OnInit {
  @ViewChild('nameInput', { static: false }) nameInputRef: ElementRef;

  playlistName: any;
  selectedFile: any;
  isFavourite: boolean;
  playlist: any;
  isSelectedPlaylist: boolean = false;
  selectedPlaylistName: any;
  currentPlaylistFile: any;
  selectedList: any = [];
  selectedPlaylist: any = [];
  isBothCharacters: boolean;
  isFavouritePlaylist: boolean;
  message: any;
  page: number = 1;
  tableSize: number = 20;
  index: any;
  renamedFileId: any;
  selectedListIndex: any;
  confirm(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      Swal.fire({
        title: `${this.animationService.message}`,
        icon: 'info',
        position: 'top',
        showCloseButton: true,
        showCancelButton: true,
        focusConfirm: false,
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        },
        confirmButtonText:
          '<i class="fa fa-thumbs-up"></i> Yes',
        confirmButtonAriaLabel: 'Thumbs up',
        cancelButtonText:
          '<i class="fa fa-thumbs-down"></i> No',
        cancelButtonAriaLabel: 'Thumbs down'
      }).then((result) => {
        if (result.isConfirmed) { resolve(true) }
        else if (result.isDismissed) { resolve(false) }
        else resolve(false);
      })
    })
  }
  constructor(private animationService: AnimationService, private apiService: ApiService, private cdr: ChangeDetectorRef) {
    this.playlistName = this.animationService.playlistName;
    this.selectedFile = this.animationService.selectedFile;
    this.isBothCharacters = this.animationService.bothCharacters;
    this.isFavourite = this.animationService.isFavourite;
    console.log(this.playlist)
  }

  onPageChange(event: any) {
    this.page = event;
    this.getAllFiles();
  }
  async ngOnInit() {
    this.getAllFiles();
  }
  async getAllFiles() {
    await this.apiService.getPlaylist().then((res) => {
      this.playlist = res;
      console.log("Playlist ", res, this.playlist);
      this.cdr.detectChanges();
    }, (err) => {
      console.error("Error occured while getting data ", err);
    })
  }
  rename(i: any, id: any, name: any) {
    this.playlistName = name;
    this.index = i;
    console.log(this.playlist[i].name);
    this.renamedFileId = id;
    this.isFavourite = true;
    this.animationService.isEdit = true;
  }
  async addSelectedFile(id: any, listName: any) {
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
          if (!this.playlist.files) {
            this.playlist.files = [];
          }
          if (file.isBothCharacterFile == true) {
            this.playlist.BothCharacters.push(file)
          }
          else
            this.playlist.files.push(file);
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
  createPlaylist(name?, selectedFile?) {
    this.isFavourite = true;
  }

  async onSubmit(playlistName, selectedFile, newName?) {
    if (this.playlistName == undefined || '') {
      alert("Please add name ");
      this.isFavourite = false;
      return;
    }
    if (this.playlistName === 'Favourites') {
      alert('Please choose another name');
      return;
    }
    if (this.animationService.isEdit && this.renamedFileId !== '') {
      newName = this.playlistName;
      console.log("rename ", newName, playlistName, this.renamedFileId);
      await this.apiService.renameSelectedPlaylist(this.renamedFileId, newName).then((res) => {
        console.log(res, `${newName}`);
        this.animationService.message = 'Playlist renamed successfully';
        this.animationService.success();
        console.log(this.playlist)
      }, (err) => {
        this.animationService.message = "Error occured can't rename playlist"
        this.animationService.error();
        console.error("Error Occured Cant rename playlist ", newName);
      });
      this.isFavourite = false;
      this.playlist[this.index].name = newName;
      this.renamedFileId = '';
      this.animationService.isEdit = false;
    }
    else if (!this.animationService.isEdit) {
      console.log(playlistName, selectedFile);
      let obj = { name: playlistName, files: [], BothCharacters: [] }
      if (this.selectedFile && this.animationService.bothCharacters == false) {
        if (confirm("Add running file in playlist?")) {
          obj.files.push(this.selectedFile)
        }
        const res = await this.apiService.addDataToPlaylist(obj).then((res) => {
          this.animationService.message = "File Added Successfully"
          this.animationService.success();
          return res;
        }, (err) => {
          this.animationService.message = "Error occured can't add file!"
          this.animationService.error();
          console.error("Error occured while adding Data", err);
        })
        console.log("New Playist added ", this.playlist);
        await this.apiService.getPlaylist().then((res) => {
          this.playlist = res;
        }).catch((err) => {
          console.error("ERROR occure while getting data ", err);
          this.animationService.message = "Error occured while getting data";
          this.animationService.error();
        })
      }
      else if (this.selectedFile && this.animationService.bothCharacters) {
        if (confirm("Add running file in playlist?")) {
          console.log("Both Animaiton array added ", this.animationService.bothAnimations);
          obj.BothCharacters.push(this.animationService.bothAnimations); //in db we need only one file that contains all data of the file 
          console.log("Obj file for both characters ", obj);
          const res = await this.apiService.addDataToPlaylist(obj).then((res) => {
            this.animationService.message = "File Added Successfully"
            this.animationService.success();
            this.playlist.push(obj);
            return res;
          },
            (err) => {
              this.animationService.message = "Error occured can't add file!"
              this.animationService.error();
              console.error("Error occured while adding Data", err);
            })
          console.log("New Playist added ", this.playlist);
        }
      }
      else {
        const res = await this.apiService.addDataToPlaylist(obj).then((res) => {
          this.animationService.message = "File Added Successfully"
          this.animationService.success();
          return res;
        },
          (err) => {
            this.animationService.message = "Error occured can't add file!"
            this.animationService.error();
            console.error("Error occured while adding Data", err);
          })
      }
      this.isFavourite = false;
      await this.apiService.getPlaylist().then(res => {
        this.playlist = res;
      }).catch((err) => {
        console.error("Error occured while getting data ", err);
      })
    }
    if (this.nameInputRef && this.nameInputRef.nativeElement) {
      this.nameInputRef.nativeElement.value = '';
      this.isFavourite = false;
    }
    selectedFile = this.playlistName;
  }
  sendToPreview(event, file) {
    if (event.target.id != "delete") {
      console.log(file.markFavourite);
      console.log('selected List', this.selectedList[0].BothCharacters);
      this.currentPlaylistFile = file.name;
      this.animationService.sendToPreview(file);
    }
  }
  loadBothCharacter(file) {
    let animation1;
    let animation2;
    for (let i = 0; i < 2; i++) {
      if (i == 0) animation1 = file.files[0];
      else animation2 = file.files[1];
    }
    this.animationService.selectedFile = file;
    this.animationService.loadCharacter(animation1.img, this.animationService.selectedCharacter, this.animationService.selectedCharacter2, animation2.img);
  }
  removeFromList(file) {
    this.currentPlaylistFile = '';
    this.animationService.removeFromList(file);
  }
  async deleteSelectedListItem(i, list, file, name) {
    const pid = list._id;
    const id = file._id;
    const listName = list.name
    console.log(pid, file, name, i)
    let id1 = file._id;
    if (listName == 'Favourites') {
      file.markFavourite = false; this.animationService.isFavourite = false;
      await this.apiService.updateFileFavourite(file._id, file.markFavourite).subscribe((res) => {
        console.log("removed from favourites ", res)
      }, (err) => {
        console.error("Error occured cant remove from favourites ", err);
      })
    }
    if (id == undefined && name == 'files') {
      id1 = this.selectedList[0].files[i].id;
      console.log("new id to be passed= ", id)
    } if (id == undefined && name !== 'files') {
      id1 = this.selectedList[0].BothCharacters[i].id;
      console.log("new id to be passed= ", id)
    }
    console.log("id ", id1)
    const res = await this.apiService.deleteSelectedListItem(this.selectedList[0]._id, id, name).then((res) => {
      console.log(res)
      this.animationService.message = "File deleted Successfully"
      this.animationService.success();
      if (name == "files")
        this.playlist.files.splice(i, 1);
      else this.playlist.BothCharacters.splice(i, 1);
    }).catch((err) => {
      this.animationService.message = "Error occured can't delete file!"
      this.animationService.error();
      console.error("Erorr occured while deleting data ", err);
    })
  }
  showPlaylist(event, list, id, index?: any) {
    if (event.target.id != "add" && event.target.id != "edit" && event.target.id != "delete") {
      this.isSelectedPlaylist = true;
      this.selectedPlaylist = [list];
      this.selectedList = [list];
      this.selectedPlaylistName = list.name;
      this.animationService.selectedList = this.selectedList;
      if (index)
        this.selectedListIndex = index;
    }
    if (index)
      this.selectedListIndex = index;
    this.selectedList = [list];
    this.playlist._id = this.selectedList[0]._id;
    this.playlist.files = this.selectedList[0].files;
    this.playlist.BothCharacters = this.selectedList[0].BothCharacters;
  }
  async deletePlaylist(id: any, i?: any) {
    console.log(id);
    this.animationService.message = "Want to delete this playlist?";
    let isConfirmed = await this.confirm();
    if (isConfirmed) {
      await this.apiService.deletePlaylist(id).then((res) => {
        this.animationService.message = "File Deleted Successfully"
        this.animationService.success();
        this.animationService.message = '';
        if (i !== undefined)
          this.playlist.splice(i, 1);
        else this.playlist.splice(this.selectedListIndex, 1);
        this.isSelectedPlaylist = false; //go back to playlist page 
        return res;
      },
        (err) => {
          this.animationService.message = "Error occured can't delete file!"
          this.animationService.error();
          console.error("Error occured cant delete Data", err);
          this.playlist = this.playlist;
        })
    }
    this.isFavourite = false;
  }

}
