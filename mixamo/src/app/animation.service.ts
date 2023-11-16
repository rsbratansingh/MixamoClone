import { ElementRef, Injectable, OnDestroy, OnInit } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BehaviorSubject, Observable } from 'rxjs';
import Fuse from 'fuse.js';
import { ApiService } from './services/api.service';
// import Swal from 'sweetalert2';
declare var Swal: any;
import * as JSZip from 'jszip';
@Injectable({
  providedIn: 'root'
})
export class AnimationService implements OnInit, OnDestroy {
  myDiv: ElementRef | null = null;
  container: any;
  isFavourite: boolean = false;
  isEdit = false;
  toggleImage = false;
  selectedFile: any;
  bothAnimations: any = [];
  selectedList: any = [];
  nameforEdit: string;
  selectedExtension: any;
  playlistName: any;
  fbxUrl: string;
  glbUrl: string;
  viewPlaylist: boolean = false;
  bothCharacters: boolean = false;
  changeSecondCharacter: boolean = false;
  isSelectedFile: boolean = false;
  firstAnimation: any;
  secondAnimation: any;
  selectedCharacter: any;
  selectedCharacter2: any;
  filteredFiles: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  filteredBothAnimationFiles: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
  files: any[] = [];
  bothAnimationFiles: any[] = [];
  currentAnimationDuration: number = 0;
  totalAnimationDuration: any = 0;

  Playlist: any;
  playlist: any[] = [];
  favouriteFile = '../assets/favourite2.svg';
  glb: GLTFLoader;
  fbx: FBXLoader;
  objLoader: OBJLoader;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  clock: THREE.Clock;
  animationBoundingBox: any;
  mixer: THREE.AnimationMixer;
  mixers: THREE.AnimationMixer[] = [];
  controls: any;
  animationTime: any;
  animationTime2: any
  totalAnimationTime: any = 0;
  animationPaused: boolean = false;
  animationActions: THREE.AnimationAction[] = [];
  currentAction: THREE.AnimationAction
  currentAction2: THREE.AnimationAction
  fileAnimations = [];
  character: any;
  character2: any;
  animationCharacter: any;
  animationCharacter2: any;
  query: any[] = [];
  fuse: any;
  fuse2: any;
  message: any;
  allFbxAnimations: any = [];
  constructor(private apiService: ApiService) {
    this.apiService.AddFilesBySrc().subscribe((res) => {
      console.log("Now files are added to the database", res);
    })
    this.apiService.getData().subscribe((res) => {
      this.files = res;
      console.log("this.files ", this.files);
      this.filteredFiles.next(this.files.slice());
      const options = {
        keys: ['name', 'tags'], //the property to search for 
        includeScore: true,
        threshold: 0.3,
      }
      this.fuse = new Fuse(this.files, options)
    })
    this.apiService.getBothAnimationFiles().subscribe((res) => {
      this.bothAnimationFiles = res;
      // JSON.parse(res);
      console.log("both aniamtion files ", res, this.bothAnimationFiles);
      this.filteredBothAnimationFiles.next(this.bothAnimationFiles.slice());
      const options = {
        keys: ['name', 'tags'],
        includeScore: true,
        threshold: 0.3
      }
      this.fuse2 = new Fuse(this.bothAnimationFiles, options)
    })
  }
  async ngOnInit() {
    if (this.files.length == 0) {
      this.apiService.getData().subscribe((res) => {
        this.files = res;
        console.log("now files are edited with new data ", this.files);
      })
    }
    if (this.bothAnimationFiles.length == 0) {
      this.apiService.getBothAnimationFiles().subscribe((res) => {
        this.bothAnimationFiles = res;
        console.log("both aniamtion files ", this.bothAnimationFiles);
      })
    }
    if (this.playlist.length == 0) {
      await this.apiService.getPlaylist().then(res => {
        this.playlist = res;
        this.Playlist = res;
        console.log('Playlsit subscription ', this.Playlist, res);
      })
    }
  }
  confirm(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      Swal.fire({
        title: `${this.message}`,
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
  success() {
    Swal.fire({
      position: 'top',
      toast: true,
      icon: 'success',
      showConfirmButton: false,
      timer: 2000,
      title: `${this.message}`,
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    })
  }
  error() {
    Swal.fire({
      position: 'top',
      toast: true,
      icon: 'error',
      timerProgressBar: true,
      showConfirmButton: false,
      timer: 2000,
      title: `${this.message}`
    })
  }
  escapeRegExp(word) {
    // Function to escape special characters in the search term for regex
    return word.replace(/[.*+\-?^${}()|[\]\\]/g, '//$&');
  }
  search(query, extensionType?, checkbox = []) {
    this.query.push(query);
    // if (!query || query.trim() === '') {
    if (!this.bothCharacters) {
      if (this.selectedExtension !== 'all' && this.bothCharacters == false) {
        const filteredFiles = this.files.filter((file) => file.src.some((value) => value.endsWith(`${extensionType}`)));
        this.filteredFiles.next(filteredFiles);
      }
      else {
        this.filteredFiles.next(this.files.slice());
        this.sortFiles();
      }
    }
    if (this.bothCharacters) {
      if (this.selectedExtension !== 'all') {
        const filteredBothFiles = this.bothAnimationFiles.filter((file) => file.src.some((value) => value.endsWith(`${extensionType}`)));
        this.filteredBothAnimationFiles.next(filteredBothFiles);
      }
      else {
        this.filteredBothAnimationFiles.next(this.bothAnimationFiles.slice());
        this.sortFiles();
      }
    }
    if (!this.bothCharacters) {
      if (query && query.trim() !== '') {
        if (checkbox.length) {
          if (this.filteredFiles.getValue().length > 0) {
            const options = {
              keys: ['name', 'tags'],
              includeScore: true,
              threshold: 0.7,
            }
            this.fuse = new Fuse(this.filteredFiles.getValue(), options)
          }
          else {
            const options = {
              keys: ['name', 'tags'],
              includeScore: true,
              threshold: 0.7,
            }
            this.fuse = new Fuse(this.filteredFiles.getValue(), options)
          }
          let matchedFiles;
          // = this.files;
          checkbox.forEach((word, i) => {
            let keyword = word.toLowerCase();
            const result = this.fuse.search(keyword)
            matchedFiles = result.map((result) => result);
          })
          this.filteredFiles.next(matchedFiles);
        }
        const lowercasequery = query.toLowerCase();
        if (this.query.length > 1) {
          //it means it search for second time and now search it from the filtered files
          if (this.filteredFiles.getValue().length > 0) {
            const options = {
              keys: ['name', 'tags'],
              includeScore: true,
              threshold: 0.3,
            }
            this.fuse = new Fuse(this.filteredFiles.getValue(), options)
          }
          const result = this.fuse.search(lowercasequery)
          const matchedFiles = result.map((result) => result.item);
          console.log("filtered files after search ", matchedFiles);
          this.filteredFiles.next(matchedFiles);
        }
        else {
          const result = this.fuse.search(lowercasequery)
          const matchedFiles = result.map((result) => result.item);
          this.filteredFiles.next(matchedFiles);
        }
      }
      else {
        this.filteredFiles.next(this.files.slice());
      }
      this.sortFiles();
    }
    if (this.bothCharacters) {
      if (query && query.trim() !== '') {
        const lowercasequery = query.toLowerCase();
        if (this.query.length > 1) {
          //it means it search for second time and now search it from the filtered files
          if (this.filteredBothAnimationFiles.getValue().length > 0) {
            const options = {
              keys: ['name', 'tags'],
              includeScore: true,
              threshold: 0.3,
            }
            this.fuse2 = new Fuse(this.filteredBothAnimationFiles.getValue(), options)
          }
          const result = this.fuse2.search(lowercasequery)
          const matchedFiles = result.map((result) => result.item);
          console.log("filtered files after search ", matchedFiles);
          this.filteredBothAnimationFiles.next(matchedFiles);
        }
        else {
          const result = this.fuse2.search(lowercasequery)
          const matchedFiles = result.map((result) => result.item);
          this.filteredBothAnimationFiles.next(matchedFiles);
        }
      }
      else {
        this.filteredBothAnimationFiles.next(this.bothAnimationFiles.slice());
      }
      this.sortFiles();
    }
    this.sortFiles();
  }
  getSearchKeyword() {
    return this.query;
  }
  removeSearch(i: any, word: any) {
    console.log("search keyword query ", this.query);
    this.query.splice(i, 1);
    console.log("search keyword query", this.query);
    // Reset the fuse instance to the original files
    const options = {
      keys: ['tags', 'name'],
      includeScore: true,
      threshold: 0.4,
    };
    this.fuse = new Fuse(this.files, options);
    this.fuse2 = new Fuse(this.bothAnimationFiles, options);
    // Perform the search again with the remaining queries
    const lowercaseQueries = this.query.map((q) => q.toLowerCase());
    if (this.query.length == 0) {
      this.filteredFiles.next(this.files.slice());
      this.filteredBothAnimationFiles.next(this.bothAnimationFiles.slice());
    }
    else {
      if (!this.bothCharacters) {
        const result = this.fuse.search(lowercaseQueries.join(' '));
        console.log("query ", this.query);
        const matchedFiles = result.map((result) => result.item);
        this.filteredFiles.next(matchedFiles);
      }
      else {
        const result = this.fuse2.search(lowercaseQueries.join(' '));
        console.log("query ", this.query);
        const matchedFiles = result.map((result) => result.item);
        this.filteredBothAnimationFiles.next(matchedFiles);
      }
    }
  }
  onDropDownClick(extensionType: any) {
    if (extensionType !== 'all') {
      const filteredFiles = this.files.filter((file) => file.src.some((value) => value.endsWith(`${extensionType}`)));
      console.log("filtered files ", filteredFiles);
      this.filteredFiles.next(filteredFiles);
      this.sortFiles();
    } else {
      this.filteredFiles.next(this.files.slice());
    }
  }
  getFilteredAndSortedFiles(): Observable<any[]> {
    return this.filteredFiles.asObservable();
  }
  getFilteredAndSortedBothFiles(): Observable<any[]> {
    return this.filteredBothAnimationFiles.asObservable();
  }
  sortFiles() {
    console.log("FIltered files after fuse search ", this.filteredFiles);
    if (!this.bothCharacters) {
      if (this.filteredFiles.getValue().length !== 0) {
        const sortedFiles = this.filteredFiles.getValue().slice().sort((a, b) => a.name.localeCompare(b.name));
        console.log("files that are gave to filtered files ", sortedFiles);
        this.filteredFiles.next(sortedFiles);
      }
    }
    else {
      if (this.filteredBothAnimationFiles.getValue().length !== 0) {
        const sortedFiles = this.filteredBothAnimationFiles.getValue().slice().sort((a, b) => a.name.localeCompare(b.name));
        console.log("files that are gave to filtered files ", sortedFiles);
        this.filteredBothAnimationFiles.next(sortedFiles);
      }
    }
  }
  downloadFile(fileUrl: any): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', fileUrl, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(new Uint8Array(xhr.response))
        } else {
          reject(new Error(`Failed to download file: ${fileUrl}`))
        }
      }
      xhr.send();
    })
  }
  async download(formate, animation) {
    const zip = new JSZip;
    let zipArray = [];
    let animationNo = Number(animation);
    console.log('type of animation ', typeof (animationNo), animationNo);
    if (this.selectedFile) {
      if (this.selectedFile.isBothCharacterFile) {
        let particularFile: any = [];
        let fileName: any[] = [];
        let fileContent: any;
        // let fileContent: any[] = [];
        let i: any = 0;
        if (animationNo == 2) {
          if (formate == "All") {
            particularFile.push(...this.selectedFile.files[0].src)
            particularFile = particularFile.concat(...this.selectedFile.files[1].src)
            if (this.selectedFile.src.length) {
              particularFile = particularFile.concat(...this.selectedFile.src);
            }
          } else {
            particularFile = this.selectedFile.files[0].src.filter((file) => file.endsWith(formate));
            particularFile = particularFile.concat(this.selectedFile.files[1].src.filter((file) => file.endsWith(formate)));
            if (this.selectedFile.src.length) {
              particularFile = particularFile.concat(...this.selectedFile.src.filter((file) => file.endsWith(formate)));
            }
          }
        } else {
          if (formate == "All") {
            particularFile.push(...this.selectedFile.files[animationNo].src);
            if (this.selectedFile.src.length) {
              particularFile = particularFile.concat(...this.selectedFile.src);
            }
          } else {
            particularFile = this.selectedFile.files[animationNo].src.filter((file) => file.endsWith(formate))
            if (this.selectedFile.src.length) {
              particularFile = particularFile.concat(...this.selectedFile.src.filter((file) => file.endsWith(formate)));
            }
          }
        }
        if (particularFile.length) {
          console.log("particular file for download ", particularFile);
          try {
            const promises = particularFile.map(async (file, i) => {
              try {
                fileName.push(file.substring(file.lastIndexOf('/') + 1));
                fileContent = await this.downloadFile(file);
                zip.file(fileName[i], fileContent);
                // fileContent.push(await this.downloadFile(file));
                // zip.file(fileName[i], fileContent[i]);
                // i++;
                console.log("file content ", fileContent, fileName);
              } catch (err) {
                console.error("Erorr occured can't zip file for download ", err);
              }
            })
            // console.log("file content ",fileContent);
            // particularFile.forEach((file,i)=>{
            //   zip.file(file.substring(file.lastIndexOf('/') + 1), fileContent[i]);
            // })
            console.log("zip file ", zipArray);
            await Promise.all(promises).then(async () => {
              await zip.generateAsync({ type: 'blob' }).then((content) => {
                const link = document.createElement('a');
                console.log("zipBlob ", content);
                link.href = URL.createObjectURL(content);
                link.download = `${this.selectedFile.name}.zip`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                this.message = "File downloaded successfully";
                this.success();
              })
            })

            // await Promise.all(particularFile.map(async (file) => {
            //   try {
            //     fileName = file.substring(file.lastIndexOf('/') + 1);
            //     const fileContent = await this.downloadFile(file);
            //     console.log("file content ", fileContent);
            //     zip.file(fileName, fileContent);
            //     console.log("zip file ",zip.file);
            //   } catch (err) {
            //     console.error("Erorr occured can't zip file for download ", err);
            //   }
            // }))
            // console.log("Promise for download ", promises);
            // await Promise.all(promises).then(() => {
            // particularFile.forEach(async(file) => {
            //   fileName = file.substring(file.lastIndexOf('/') + 1);
            //   const fileContent =await this.downloadFile(file);
            //   zip.file(fileName,fileContent)
            // })
            // zip.generateAsync({ type: 'blob' }).then((content) => {
            // const zipBlob = await zip.generateAsync({ type: 'blob' });
            // const link = document.createElement('a');
            // console.log("zipBlob ",zipBlob);
            // link.href = URL.createObjectURL(zipBlob);
            // link.download = `${this.selectedFile.name}.zip`;
            // link.style.display = 'none';
            // document.body.appendChild(link);
            // link.click();
            // document.body.removeChild(link);
            // this.message = "File downloaded successfully";
            // this.success();
            // }).catch((error) => {
            //   console.error('Error downloading files:', error);
            //   this.message = 'Error downloading files';
            //   this.error();
            // });
          }
          catch (error) {
            console.error('Error downloading files:', error);
            this.message = 'Error downloading files';
            this.error();
          };
        }
        else if (particularFile.length === 0) {
          this.message = "No files with the selected format found for the given animation.";
          this.error();
          return;
        }
        else {
          this.message = "No files with the selected format found for the given animation.";
          this.error();
          return;
        }
      }
      else {
        let fileName: any[] = [];
        let particularFile: any = []
        if (formate == "All") {
          particularFile.push(...this.selectedFile.src);
          console.log("all files ", particularFile);
        } else {
          particularFile = this.selectedFile.src.filter((file) => file.endsWith(formate));
        }
        if (particularFile.length) {
          const promises = particularFile.map(async (file, i) => {
            fileName.push(file.substring(file.lastIndexOf('/') + 1));
            const fileContent = await this.downloadFile(file);
            console.log("file content ", fileContent);
            // const fileData=new Blob([fileContent],{type:'blob'});
            zip.file(fileName[i], fileContent);
            // zip.file(fileName,fileData)
          })
          console.log("Promise for download ", promises);
          await Promise.all(promises).then(async () => {
            const zipblob1 = await zip.generateAsync({ type: 'blob' })
            // .then((content) => {
            const link = document.createElement('a');
            // console.log("Content ",content);
            link.href = URL.createObjectURL(zipblob1);
            link.download = `${this.selectedFile.name}.zip`;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.message = 'File downloaded successfully';
            this.success();
            // })
          }).catch((error) => {
            console.error('Error downloading files:', error);
            this.message = 'Error downloading files';
            this.error();
          })
        }
        else if (particularFile.length == 0) {
          this.message = "No files with the selected format found"
          this.error();
          return;
        }
      }
      this.message = "File downloaded successfully"
      this.success();
    }
    else {
      this.message = "Can't download file!"
      this.error();
      return;
    }
  }
  setContainer(container: ElementRef) {
    this.myDiv = container;
  }
  initializScene() {
    const height = this.myDiv.nativeElement.clientHeight;
    const width = this.myDiv.nativeElement.clientWidth;
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 10000);
    this.camera.position.set(-0.5, 1.4, -4);
    this.clock = new THREE.Clock();
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xcbcbcb);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.useLegacyLights = false;

    // for optimize performace
    // this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.myDiv.nativeElement.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.rotateSpeed = 1.5;
    this.controls.target.set(0, 0.8, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.09;

    // on resize of the screen it show scene on full screen 
    // window.addEventListener('resize', () => this.onWindowResize());

    const dirLight = new THREE.DirectionalLight(0xffffff, 10);
    dirLight.position.set(3, 9, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    dirLight.shadow.bias = -0.0005;
    dirLight.shadow.mapType = THREE.PCFShadowMap;
    this.scene.add(dirLight);
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
    this.scene.add(ambientLight);
    const grid = new THREE.GridHelper(2000, 3000, 0x000000, 0x000000);
    grid.material.opacity = 0.1;
    grid.material.transparent = true;
    this.scene.add(grid);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0x000000, depthWrite: false }));
    mesh.material.roughness = 0.1;
    mesh.material.metalness = 0.8;
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    mesh.shadowDarkness = 1;
    this.scene.add(mesh);
    const cameraDistance = 5;
    const offset = new THREE.Vector3(0, -1, cameraDistance);
    if (this.character) {
      this.character.position.set(0, -1, 2);
      this.character.castShadow = true;
      this.character.receiveShadow = true;
      this.character.side = THREE.DoubleSide;
    }
    if (this.character && this.character.quaternion) {
      offset.applyQuaternion(this.character.quaternion);
      this.camera.position.copy(this.character.position).add(offset);
      // this.camera.position.set(0,-1,30)
      // const targetPosition=new THREE.Vector3(-10,-10,2);
      this.camera.lookAt(this.character.position);
      // this.camera.lookAt(targetPosition);
      console.log(`Character position x:${this.character.position.x}, y:${this.character.position.y}, z:${this.character.position.z}`);
    }
    this.mixer = new THREE.AnimationMixer(this.scene);
    this.animate();
    this.controls.update();
  }
  animate() {
    if (this.character || this.character2) {
      this.scene.remove(this.character);
      this.scene.remove(this.character2);
      this.character = null;
      this.character2 = null;
    }
    let animationUrl = '';
    let animationUrl2 = '';
    if (!this.selectedCharacter)
      this.selectedCharacter = "../assets/Animations/Y Bot.fbx"; //male
    if (!this.selectedCharacter2)
      this.selectedCharacter2 = "../assets/Animations/X Bot.fbx"; //female
    if (this.bothCharacters == true) {
      this.loadCharacter(animationUrl, this.selectedCharacter, this.selectedCharacter2, animationUrl2)
    }
    else {
      this.loadCharacter(animationUrl, this.selectedCharacter);
    }
    this.runAnimate();
  }
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.controls.update();
  }
  // apply changes to stop the animation 
  animationId: number;
  isAnimating: boolean = true;
  count = 0;
  runAnimate() {
    // apply changes to stop the animation 
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      if (!this.isAnimating) // || this.count == 1) {
      {
        this.currentAnimationDuration = 0;
        this.totalAnimationDuration = 100;
        this.currentAction = null;
        this.currentAction2 = null;
        this.totalAnimationTime = 0;
        this.customTimeDuration=null;
        // cancelAnimationFrame(this.animationId);
        return;
      }
      // requestAnimationFrame(this.runAnimate.bind(this));
      let delta = this.clock.getDelta();
      if (this.customTimeDuration && this.isAnimating) {
        //onRangeChnage funciton gives the time value and it will chnage the time according to this 
        for (const mixer of this.mixers) {
          mixer.setTime(this.customTimeDuration);
          mixer.update(this.currentAnimationDuration); //0
        }
        this.customTimeDuration = null;
      } else {
        for (const mixer of this.mixers) mixer.update(delta);
      }
      if (!this.animationPaused) {
        this.totalAnimationTime += delta;
      }
      if (this.isAnimating && this.selectedFile && this.currentAction) {
        this.currentAnimationDuration = Math.round(this.currentAction?.time * 10);
        if (this.currentAnimationDuration == this.totalAnimationDuration) {
          this.currentAnimationDuration = 0;
        }
      }
      if (this.isAnimating && this.selectedFile && this.currentAction && this.currentAction2) {
        let timeDuration = (this.currentAction.time > this.currentAction2.time) ? this.currentAction.time : this.currentAction2.time;
        this.currentAnimationDuration = Math.round(timeDuration * 10);
        if (this.currentAnimationDuration == this.totalAnimationDuration) {
          this.currentAnimationDuration = 0;
        }
      }
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    }
    animate();
  };
  toggleFavourite() {
    this.toggleImage = !this.toggleImage;
    this.favouriteFile = this.toggleImage ? '../assets/favourite.svg' : '../assets/favourite2.svg';
  }
  sendToPreview(file?: any) {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animationPaused = false;
      this.runAnimate();
    }
    this.selectedFile = file;
    this.animationPaused = false;

    // reset all the time durations 
    this.currentAnimationDuration = 0;
    this.totalAnimationDuration = 0;
    this.animationTime = 0;

    if (file) { this.isSelectedFile = true; }
    console.log("File that is given to selected File ", file)
    console.log("selected File from service ", this.selectedFile)
    if (file.files == undefined || null) {
      this.bothCharacters = false;
      let animation1: any;
      let animation = file.src.filter((file) => file.endsWith('.fbx'));
      animation1 = animation[0];
      if (!this.scene) {
        this.initializScene();
      }
      if (animation1 == undefined || animation1 == null || animation1 == '') {
        alert("Unable to load file add fbx file");
        return;
      }
      // remove all animations that is currently running
      if (this.allFbxAnimations.length) {
        this.allFbxAnimations.forEach((fbx) => this.scene.remove(fbx));
        this.allFbxAnimations.length = 0;
      }
      if (this.character) {
        this.scene.remove(this.character);
        this.scene.remove(this.character2);
      }
      if (this.currentAction?.isRunning() || this.currentAction2?.isRunning()) {
        this.scene.remove(this.currentAction)
        if (this.currentAction2)
          this.scene.remove(this.currentAction2)
      }
      this.loadCharacter(animation1, this.selectedCharacter);
    }
    if (file.files && file.files[0].isBothCharacterFile) {
      this.bothCharacters = true;
    }
    if (file.files) {
      // means both character file is selected and now load both characters
      this.bothCharacters = true;
      if (this.character) {
        this.scene.remove(this.character);
      }

      const animation = file.files[0].src.filter((file) => file.endsWith('.fbx'));
      const Animation = file.files[1].src.filter((file) => file.endsWith('.fbx'));
      const animation1 = animation[0];
      const animation2 = Animation[0];
      if (animation1 == undefined || animation1 == null || animation1 == '' || animation2 == undefined || animation2 == null || animation2 == '') {
        alert("Unable to load file add fbx file");
        return;
      }
      this.firstAnimation = file.files[0];
      this.secondAnimation = file.files[1];
      console.log("both aniamtions ", animation2, animation1)
      this.bothAnimations = file;
      if (this.bothCharacters) { this.loadCharacter(animation1, this.selectedCharacter, this.selectedCharacter2, animation2); }
      else { this.loadCharacter(animation1, this.selectedCharacter) }
    }
    if (!file) {
      this.animate();
      this.runAnimate();
    }
  }
  handelToggleButton() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animationPaused = false;
      this.runAnimate();
    }
    // ----reset all the values of the range--------
    this.currentAnimationDuration=0;
    this.totalAnimationTime=100;
    this.totalAnimationDuration=0;
    this.currentAction=null;
    this.currentAction2=null;
    this.customTimeDuration=null;

    this.animationPaused = false;
    this.bothCharacters = !this.bothCharacters;
    this.animate();
  }
  changeCharacter(file) {
    this.selectedFile = file;
    console.log("selected aniamtion ", file.src[0], 'file ', file);
    if (this.changeSecondCharacter) {
      console.log("Second Chanracter changed ", this.selectedCharacter2)
      this.selectedCharacter2 = file.src[0];
    } else {
      this.selectedCharacter = file.src[0];
      console.log("first Chanracter changed ", this.selectedCharacter)
    }
    let character: any;
    character = file.src[0];

    if (this.bothCharacters) {
      if (this.changeSecondCharacter) {
        this.loadCharacter('', this.selectedCharacter, this.selectedCharacter2, '');
        return;
      }
      this.loadCharacter('', this.selectedCharacter, this.selectedCharacter2, '');
    }
    else {
      this.selectedCharacter = file.src[0];
      this.loadCharacter('', this.selectedCharacter);
    }
  }

  loadCharacter(animationUrl?, characterUrl?, characterUrl2?, animationUrl2?) {
    let character1 = "../assets/Animations/Y Bot.fbx";
    let character2 = "../assets/Animations/X Bot.fbx";
    this.fbxUrl = null;
    if (animationUrl && animationUrl2) this.bothCharacters = true;
    if (animationUrl && (animationUrl2 == null || undefined)) this.bothCharacters = false;
    if (this.bothCharacters == true) {
      character1 = characterUrl;
      if (!characterUrl2) {
        character2 = "../assets/Animations/X Bot.fbx"; //male
      }
      else
        character2 = characterUrl2;
      this.loadFBXOrGLBFile(character1).then((object: any) => {
        if (this.character) {
          this.scene.remove(this.character);
          this.character = null;
        }
        if (this.allFbxAnimations.length) {
          this.allFbxAnimations.forEach((fbx) => this.scene.remove(fbx));
          this.allFbxAnimations.length = 0;
        }
        if (this.character2) {
          this.scene.remove(this.character2);
          this.character2 = null;
        }
        if (this.animationCharacter) {
          this.scene.remove(this.animationCharacter);
          this.animationCharacter = null;
        }
        if (this.animationCharacter2) {
          this.scene.remove(this.animationCharacter2);
          this.animationCharacter2 = null;
        }
        if (character1 === '../assets/Animations/Y Bot.fbx')
          object.scale.set(0.01, 0.01, 0.01);
        else object.scale.set(0.01, 0.01, 0.01);
        object.traverse((character: any) => {
          if (character.isMesh) {
            character.castShadow = true;
            this.character = object;
          }
        });
        const initalRotation = new THREE.Quaternion();
        this.character.quaternion.copy(initalRotation);
        this.scene.add(this.character);
        this.allFbxAnimations.push(this.character); //add to the array so later we remove them
        object.rotation.set(0, Math.PI, 0);
        object.position.set(1, 0, 0);
        this.character = object;
        let mixer1 = new THREE.AnimationMixer(object);
        this.loadFBXOrGLBFile(character2).then((model2: any) => {
          if (character2 === '../assets/Animations/X Bot.fbx')
            model2.scale.set(0.01, 0.01, 0.01);
          else model2.scale.set(0.01, 0.01, 0.01); //bots
          let firstAnimation;
          let secondAnimaiton;
          model2.traverse((character: any) => {
            if (character.isMesh) {
              character.castShadow = true;
              this.character2 = model2;
            }
          });
          this.allFbxAnimations.push(this.character2);
          this.scene.add(this.character2);
          model2.position.set(-1, 0, 0);
          model2.rotation.set(0, Math.PI, 0);
          model2.rotation.y = Math.PI;
          model2.position.x = -1;
          let mixer2 = new THREE.AnimationMixer(model2);
          if (animationUrl) {
            this.loadFBXOrGLBFile(animationUrl).then((fbx1: any) => {
              fbx1.rotation.y = Math.PI;
              fbx1.position.set(1, 0, 0);
              fbx1.scale.set(0.01, 0.01, 0.01);
              fbx1.traverse((character) => {
                if (character.isMesh) {
                  character.castShadow = true;
                  this.animationCharacter = fbx1;
                  this.scene.remove(this.character);
                  mixer1 = new THREE.AnimationMixer(fbx1);
                  this.character = fbx1;
                  this.scene.add(fbx1)
                }
              })

              this.loadFBXOrGLBFile(animationUrl2).then((fbx: any) => {
                fbx.scale.set(0.01, 0.01, 0.01);
                fbx.rotation.y = Math.PI;
                fbx.position.set(-1, 0, 0);
                fbx.traverse((character) => {
                  if (character.isMesh) {
                    character.castShadow = true;
                    this.animationCharacter2 = model2;
                    this.scene.remove(this.character2);
                    this.character2 = fbx;
                    mixer2 = new THREE.AnimationMixer(fbx);
                    this.scene.add(this.character2);
                  }
                })
                let firstAnimationTime: any;
                let secondAnimationTime: any;
                firstAnimationTime = fbx1.animations[0].duration;
                firstAnimationTime = Math.round(firstAnimationTime * 10);
                secondAnimationTime = fbx.animations[0].duration;
                secondAnimationTime = Math.round(secondAnimationTime * 10);
                this.totalAnimationDuration = (firstAnimationTime > secondAnimationTime) ? firstAnimation : secondAnimationTime;

                this.currentAction = mixer1.clipAction(fbx1.animations[0]).play();
                this.currentAction2 = mixer2.clipAction(fbx.animations[0]).play();
                this.mixers.push(mixer1, mixer2);
                if (this.currentAction !== null && this.currentAction.isRunning()) {
                  console.log("Character ", this.bothCharacters);
                } else {
                  throw new Error("Can't load animation")
                }
              }).catch((err) => {
                this.message = "An Error occured while loading file...";
                this.error();
                console.log("error occured while loading file ", err);
                object.animations = firstAnimation.animations;
                object.children = firstAnimation.children;
                model2.animations = secondAnimaiton.animations;
                model2.children = secondAnimaiton.children;
                object.scale.set(0.01, 0.01, 0.01);
                model2.scale.set(0.01, 0.01, 0.01);
                this.currentAction = mixer1.clipAction(object.animations[0]).play();
                this.currentAction2 = mixer2.clipAction(model2.animations[0]).play();
                this.mixers.push(mixer1, mixer2);
              });
            }).catch((err) => {
              this.message = "An Error occured while loading file...";
              this.error();
              console.log("error occured while loading file ", err);
              object.animations = firstAnimation.animations;
              object.children = firstAnimation.children;
              model2.animations = secondAnimaiton.animations;
              model2.children = secondAnimaiton.children;
              object.scale.set(0.01, 0.01, 0.01);
              model2.scale.set(0.01, 0.01, 0.01);
              this.currentAction = mixer1.clipAction(object.animations[0]).play();
              this.currentAction2 = mixer2.clipAction(model2.animations[0]).play();
              this.mixers.push(mixer1, mixer2);
            });
            console.log(object.animations);
            if (!object.animations) { object.animations = []; }
          }
        })
      })
    }
    else {
      if (!characterUrl) {
        character1 = "../assets/Animations/Y Bot.fbx";
      } else {
        character1 = characterUrl;
      }
      this.loadFBXOrGLBFile(character1).then((object: any) => {
        console.log("character ", this.character);
        let animationFile;
        this.allFbxAnimations.push(object);
        if (this.allFbxAnimations.length) {
          this.allFbxAnimations.forEach((fbx) => this.scene.remove(fbx));
          this.allFbxAnimations.length = 0;
        }
        if (this.character) {
          const characterToRemove = this.character;
          this.scene.remove(characterToRemove);
          this.character = null;
        }
        if (this.animationCharacter) {
          console.log("animaiton character ", this.animationCharacter);
          const characterToRemove = this.animationCharacter;
          this.scene.remove(characterToRemove);
          this.animationCharacter = null;
          console.log("animaiton character ", this.animationCharacter);
        }
        object.scale.set(0.01, 0.01, 0.01);
        object.traverse((character: any) => {
          if (character.isMesh) {
            character.castShadow = true;
          }
        });
        object.rotation.y = Math.PI; // 90 degree 
        this.character = object;
        this.scene.add(this.character); //object
        if (animationUrl != '') {
          this.loadFBXOrGLBFile(animationUrl).then((fbx: any) => {
            this.fbx = new FBXLoader();
            this.allFbxAnimations.push(fbx);
            console.log("character object scene ", object, 'fbx animation ', fbx);
            let mix = new THREE.AnimationMixer(object); //object
            this.animationBoundingBox = new THREE.Box3().setFromObject(fbx);
            const animation = fbx.animations;
            console.log("fbx ", fbx);
            console.log('animation ', animation, "character animation ", object.animations);
            fbx.scale.set(0.01, 0.01, 0.01);
            fbx.rotation.y = Math.PI;
            fbx.traverse((character) => {
              if (character.isMesh) {
                mix = new THREE.AnimationMixer(fbx);
                character.castShadow = true;
                this.scene.remove(this.character);
                this.scene.add(fbx);
              }
            })
            this.currentAction = mix.clipAction(fbx.animations[0]);
            this.totalAnimationDuration = fbx.animations[0].duration;
            this.totalAnimationDuration = Math.round(this.totalAnimationDuration * 10);
            console.log("current action ", this.currentAction, this.totalAnimationDuration);
            console.log("currrent action play character", object);
            this.currentAction.play();
            this.mixers.push(mix);
          }).catch((err) => {
            this.message = "An Error occured while loading file...";
            console.error("an Error occured while loading file ", err);
            this.error();
          });
        }
      })
        .catch((err) => {
          console.error("error occured ", err);
          alert("Error occured while loading animation!")
        });
    }
  }

  resetAnimation() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.runAnimate();
    }
    if (this.mixer && this.currentAction) {
      this.currentAction.stop();
      this.currentAction.reset();
      this.currentAction.play();
      if (this.currentAction2) {
        this.currentAction2.stop();
        this.currentAction2.reset();
        this.currentAction2.play();
      }
      this.animationPaused = false;
      this.isAnimating = true;
    }
  }
  customTimeDuration: any
  onRangeChange(value: any) {
    this.animationTime = this.totalAnimationDuration;
    this.currentAnimationDuration = value;
    console.log("onRange change called with ", value);
    this.customTimeDuration = value / 10;
    this.runAnimate();
  }
  pauseAnimation(cancelAnimation?: boolean) {
    console.log("Pause called in service")
    if (this.animationId && cancelAnimation) {
      // cancelAnimationFrame(this.animationId);  //it is removed because if i pause the animation
      //  and than move the range than it will not work for that time 
      this.isAnimating = false;
    }
    if (this.mixer && this.currentAction && !this.animationPaused) {
      console.log("pause called ")
      this.animationTime = this.currentAction.time;
      this.currentAction.paused = true;
      if (this.currentAction2) {
        this.currentAction2.paused = true;
        this.animationTime2 = this.currentAction2.time
      }
      this.animationPaused = true;
    }
  }
  playAnimation() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.runAnimate();
    }
    if (this.mixer && this.currentAction && this.animationPaused) {
      this.currentAction.time = this.animationTime;
      this.currentAction.paused = false;
      this.currentAction.play();
      if (this.currentAction2) {
        this.currentAction2.paused = false;
        this.currentAction2.play();
        this.animationTime2 = this.currentAction2.time
      }
      this.animationPaused = false;
      console.log("current animation time ", this.currentAction.time, this.animationTime);
    }
  }
  loadFBXOrGLBFile(fileUrl) {
    return new Promise((resolve, reject) => {
      if (!fileUrl) {
        alert("Please add file")
        return;
      }
      let fileUrl1 = fileUrl.toLowerCase();
      const loader = fileUrl1.endsWith('.fbx') ? new FBXLoader() :null;
      //  fileUrl1.endsWith('.glb' || '.gltf') ? new GLTFLoader() : fileUrl1.endsWith('.obj') ? new OBJLoader() : fileUrl1.endsWith('.dae') ? new ColladaLoader() : null;
      if (!loader) {
        alert("Unsupported file format")
        return;
      }
      loader.load(fileUrl, (object) => {
        console.log(fileUrl);
        console.log("glb object ", object)
        resolve(object);
      }, undefined, (error) => {
        console.log("Error occured while loading file ", error)
        reject(error);
      });
    })
  }
  createPlaylist(name?: any, selectedFile?: any) {
    console.log(selectedFile == null, '&&', this.toggleImage)
    if (name && selectedFile) {
      console.log(name, selectedFile);
    }
    else {
      this.isFavourite = false;
    }
  }
  async removeFromFavourite() {
    if (this.selectedFile) {
      let favouritePlaylist: any;
      let favouritePlaylistIndex: any;
      let name: any;
      let indexOfSelectedFile: any;
      await this.apiService.getPlaylist().then((res) => {
        this.playlist = res;
        this.Playlist = res;
        console.log(this.Playlist, res);
        this.selectedFile.markFavourite = false;
        favouritePlaylist = this.Playlist.find(file => file.name == 'Favourites')
        favouritePlaylistIndex = this.Playlist.findIndex(file => file.name == 'Favourites');
        console.log("Favourite playlist ", favouritePlaylist, 'index ', favouritePlaylistIndex);
      }).catch((err) => {
        console.error("Error occured while getting data ", err);
      });
      this.selectedFile.markFavourite = false;
      await this.apiService.updateFileFavourite(this.selectedFile._id, this.selectedFile.markFavourite).subscribe((res) => {
        console.log("removed from favourites ", res)
      }, (err) => {
        console.error("Error occured cant remove from favourites ", err);

      })
      if (favouritePlaylist == null || undefined) {
        alert("No favourite playlist exists!!!");
      }
      else {
        if (this.bothCharacters == false || this.selectedFile.isBothCharacterFile == false) {
          indexOfSelectedFile = favouritePlaylist.files.filter((file) => file.id == this.selectedFile.id)
          console.log("index of selected file ", indexOfSelectedFile);
          name = "files";
        }
        else {
          indexOfSelectedFile = favouritePlaylist.BothCharacters.filter((file) => file.id == this.selectedFile.id)
          name = "BothCharacters";
        }
      }
      if (indexOfSelectedFile.length == 0) {
        if (!indexOfSelectedFile[0]?._id) {
          console.log("indexOfSelected File ", indexOfSelectedFile);
          indexOfSelectedFile[0]._id = indexOfSelectedFile.id;
        }
      }
      if (favouritePlaylist._id && indexOfSelectedFile[0]._id && name) {
        await this.apiService.deleteSelectedListItem(favouritePlaylist._id, indexOfSelectedFile[0]._id, name).then((res) => {
          console.log(res)
          this.message = "File marked as unfavourite 💕"
          this.success();
        }).catch((err) => {
          this.message = "Error occured can't delete file!"
          this.error();
          console.error("Erorr occured while deleting data ", err);
        })
      }
      else {
        this.message = "Error occured while removing data..."
        this.error();
      }
    }
  }
  async addToFavourites() {
    if (this.selectedFile) {
      let favouritePlaylist;
      let favouritePlaylistIndex;
      this.selectedFile.markFavourite = true;
      console.log("selectd file ", this.selectedFile);
      if (!this.selectedFile?._id) {
        this.selectedFile._id = this.selectedFile.id;  //this code is worked when we apply both animation on single files
        // and run two single files by both animations at that time we temperory create id that id is worked here as _id so no error occured  
      }
      await this.apiService.updateFileFavourite(this.selectedFile._id, this.selectedFile.markFavourite).subscribe((res) => {
        console.log("File marked as favourite", res);
      }, (err) => {
        console.error("error occured can't edit the file ", err);
      })
      await this.apiService.getPlaylist().then((res) => {
        this.playlist = res;
        this.Playlist = res;
        console.log(this.Playlist, res);
        console.log("selected file ", this.selectedFile);
        this.selectedFile.markFavourite = true;
        favouritePlaylist = this.Playlist.find(file => file.name == 'Favourites')
        favouritePlaylistIndex = this.Playlist.findIndex(file => file.name == 'Favourites');
      }).catch((err) => {
        console.error("Error occured while getting data ", err);
      });
      if (favouritePlaylist == null || undefined) {
        let obj = { name: 'Favourites', files: [], BothCharacters: [] }
        if (this.bothCharacters == false) {
          obj.files.push(this.selectedFile);
        }
        else { obj.BothCharacters.push(this.selectedFile); }
        const res = await this.apiService.addDataToPlaylist(obj).then((res) => {
          this.message = "File marked as Favourite 💖";
          this.success();
          this.Playlist.push(obj);
          return res;
        },
          (err) => {
            this.message = "Error occured can't add file!"
            this.error();
            console.error("Error occured while adding Data", err);
          })
      }
      else {
        this.selectedFile.markFavourite = true;
        const res = await this.apiService.addDataToPlaylist(this.selectedFile, favouritePlaylist._id).then((res) => {
          this.message = "File marked as Favourite 💖";
          this.success();
          setTimeout(() => {
            if (this.bothCharacters == false) {
              favouritePlaylist.files.push(this.selectedFile);
              this.Playlist[favouritePlaylistIndex] = favouritePlaylist;
            }
            else {
              favouritePlaylist.BothCharacters.push(this.bothAnimations[0]);
              this.Playlist[favouritePlaylistIndex] = favouritePlaylist;
            }
          }, 500)
          return res;
        },
          (err) => {
            this.message = "Error occured can't add file!"
            this.error();
            console.error("Error occured while adding Data", err);
          })
      }
    }
    this.isFavourite = false;
    this.favouriteFile == "../assets/favourite2.svg"
    if (!this.selectedFile) {
      alert("Add file First")
      this.favouriteFile == "../assets/favourite2.svg"
      this.toggleImage = false;
      return;
    }
  }

  async onSubmit(name?: any, selectedFile?: string, editedName?: any) {
    if (this.isEdit == false) { this.isFavourite = false; }
    else {
      this.isEdit = false;
    }
  }
  showPlaylist(event: any, list: any, i: any, nameforEdit?: any) {
    if (event.target.id == "edit") {
      this.isFavourite = true;
      this.isEdit = true;
      this.nameforEdit = nameforEdit;
      this.playlistName = list.name;
    }
    if (event.target.id == "delete") {
      if (confirm("Are you sure to want to delete")) {
        const index = this.playlist.indexOf(list);
        this.playlist.splice(index, 1);
      }
      else { return; }
    }
    else {
      this.viewPlaylist = true;
      this.selectedList = this.playlist.filter((file) => file.name == list.name);
    }
  }
  removeFromList(file: any) {
    const i = this.selectedList[0].files.findIndex(f => f.name === file.name)
    const a = this.selectedList[0].BothCharacters.findIndex(f => f.name === file.name);
    if (i !== -1) this.selectedList[0].files.splice(i, 1);
    else this.selectedList[0].BothCharacters.splice(a, 1);
  }
  deleteSelectedList() {
    const index = this.playlist.findIndex(x => x.name == this.selectedList[0].name);
    this.playlist.splice(index, 1);
    this.viewPlaylist = false;
  }
  ngOnDestroy(): void {
    if (this.filteredFiles) {
      this.filteredFiles.unsubscribe();
    }
  }
}
