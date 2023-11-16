import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs';
import { AnimationService } from '../animation.service';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  public apiUrl = 'http://localhost:3000';
  constructor(private http: HttpClient) { }
  getData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/files`);
  }
  getBothAnimationFiles():Observable<any>{
    return this.http.get(`${this.apiUrl}/bothAnimationFiles`);
  }
  AddFilesBySrc(data:boolean=false): Observable<any> {
    console.log("this funciton called with ",data);
    return this.http.get(`${this.apiUrl}/files/data/${data}`);
  }
  getPlaylist(): Promise<any> {
    console.log("All Playlist Files")
    return this.http.get(`${this.apiUrl}/playlist`).toPromise();
  }
  getSelectedPlaylistFiles(id: any): Promise<any> {
    console.log("All files of Playlist");
    return this.http.get(`${this.apiUrl}/playlist/${id}`).toPromise()
  }
  getFileContent(fileName: any) {
    console.log("api called ", fileName);
    return this.http.get(`/files/${fileName}`);
  }
  updateFileData(id, updatedData: any): Observable<any> {
    console.log(id, "updated data ", updatedData);
    return this.http.post(`${this.apiUrl}/files/updateFile/${id}`, updatedData)
  }
  updateFileFavourite(id, markFavourite1: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }
    console.log("favourite ", markFavourite1);
    return this.http.put(`${this.apiUrl}/files/fileFavourite/${id}`, { markFavourite: markFavourite1 }, httpOptions)
  }
  addNewFile(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/files/newData`, data);
  }
  // add files to the db by list component 
  addFiles(data: any): Observable<any> {
    console.log("data ", data);
    return this.http.post(`${this.apiUrl}/files/uploadData`, data)
  }
  // merge two animation files in bothAnimation files 
  mergeFiles(data: any):Observable<any>{
    console.log("data of both files ", data);
    return this.http.post(`${this.apiUrl}/mergeFiles`, data)
  }
  uploadImage(image: any) {
    console.log("image data ", image);
    return this.http.post(`${this.apiUrl}/upload`, image)
  }
  generateRandomId() {
    let randomNumber = '';
    for (let i = 0; i < 8; i++) {
      randomNumber += Math.floor(Math.random() * 10); // Generates a random digit
    }
    return randomNumber;
  }
  async addDataToPlaylist(data: any, id?: any): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    // arguments.length==1 means we add data in the existing playlist by add button 
    if (arguments.length == 1 && data.files.length > 0) {
      let number = await this.generateRandomId();
      data.files[0].index = number.toString();
      console.log("data with id ", data);
    }
    if (arguments.length == 1 && data.BothCharacters.length > 0) {
      let number = await this.generateRandomId();
      data.BothCharacters[0].index = number.toString();
      console.log("data with id ", data);
    }
    data = JSON.stringify(data);
    console.log("API.json", data);
    if (arguments.length == 1)
      return this.http.post(`${this.apiUrl}/added`, data, httpOptions).toPromise();
    else
      return this.http.post(`${this.apiUrl}/added/${id}`, data, httpOptions).toPromise();
  }

  renameSelectedPlaylist(id: any, name: any): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    }
    return this.http.put(`${this.apiUrl}/rename/${id}`, { name: name }, httpOptions).toPromise();
  }
  deletePlaylist(id: any): Promise<any> {
    console.log(id);
    return this.http.delete<any>(`${this.apiUrl}/playlist/${id}`).toPromise();
  }
  deleteSelectedListItem(pid: any, id: any, name: string): Promise<any> {
    return this.http.delete(`${this.apiUrl}/Playlist/${pid}/${name}/${id}`).toPromise();
  }
}
