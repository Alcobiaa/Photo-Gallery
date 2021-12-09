import { useState, useEffect } from "react";
import { isPlatform } from "@ionic/react";
import { Camera, CameraPhoto, CameraResultType, CameraSource, Photo, } from "@capacitor/camera";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Storage } from "@capacitor/storage";
import { Capacitor } from "@capacitor/core";
import { fileURLToPath } from "url";

const PHOTO_STORAGE = 'photos';
export function usePhotoGallery() {
    const [photos, setPhotos] = useState<UserPhoto[]>([]);
  
    useEffect(() => {
      const loadSaved = async () => {
        const { value } = await Storage.get({ key: PHOTO_STORAGE });
        const photosInStorage = (value ? JSON.parse(value) : []) as UserPhoto[];
    
        for (let photo of photosInStorage) {
          const file = await Filesystem.readFile({
            path: photo.path ? photo.path : '',
            directory: Directory.Data,
          });
          // Web platform only: Load the photo as base64 data
          photo.webviewPath = `data:image/jpeg;base64,${file.data}`;
        }
        setPhotos(photosInStorage);
      };
      loadSaved();
    }, []);

    const takePhoto = async () => {
        const photo = await Camera.getPhoto({
            resultType: CameraResultType.Uri,
            source: CameraSource.Camera,
            quality: 100
        });

        const fileName = new Date().getTime() + ".jpeg";
        const savedFileImage = await savePicture(photo, fileName);
        const newUserPhoto: UserPhoto = {
          path: savedFileImage.path,
          webviewPath: savedFileImage.webPath,
        }
        const newPhotos: UserPhoto[] = [newUserPhoto, ...photos];
        setPhotos(newPhotos);

        Storage.set({key: PHOTO_STORAGE, value: JSON.stringify(newPhotos)});
    }

    

    const savePicture= async (photo: CameraPhoto, fileName: string): Promise<Photo> => {
        const base64Data = await base64FromPath(photo.webPath!);
        const savedFile = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Data
        });

        // Use webPath to display the new image instead of base64 since it's
        // already loaded into memory
        //return{
          //path: photo.path,
          //webviewPath: photo.webPath,
          // base64String: photo.base64String,

        return photo
    }

    return{
      photos,
      takePhoto,
    }
}

export interface UserPhoto{
    path?: string,
    webviewPath?: string,
}

export async function base64FromPath(path: string): Promise<string> {
    const response = await fetch(path);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject('method did not return a string')
        }
      };
      reader.readAsDataURL(blob);
    });
}
