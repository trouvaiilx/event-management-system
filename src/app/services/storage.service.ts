// src/app/services/storage.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storage: Map<string, any> = new Map();
  private storageSubjects: Map<string, BehaviorSubject<any>> = new Map();

  constructor() {
    console.log('StorageService initialized');
    this.initializeDefaultData();
  }

  // Initialize with default admin user
  private initializeDefaultData(): void {
    const defaultAdmin = {
      id: 'admin-001',
      email: 'admin@helpevents.com',
      password: 'Admin@123',
      role: 'ADMIN',
      fullName: 'System Administrator',
      phoneNumber: '+62-812-3456-7890',
      createdAt: new Date(),
      mustChangePassword: false,
      isActive: true,
    };

    // Initialize default collections
    this.set('users', [defaultAdmin]);
    this.set('events', []);
    this.set('ticketCategories', []);
    this.set('seats', []);
    this.set('promotionalCodes', []);
    this.set('bookings', []);
    this.set('payments', []);
    this.set('waitlists', []);
    this.set('notifications', []);

    console.log('Default data initialized. Admin user:', defaultAdmin.email);
  }

  set(key: string, value: any): void {
    this.storage.set(key, value);
    if (this.storageSubjects.has(key)) {
      this.storageSubjects.get(key)?.next(value);
    }
  }

  get(key: string): any {
    return this.storage.get(key);
  }

  getObservable(key: string): Observable<any> {
    if (!this.storageSubjects.has(key)) {
      const subject = new BehaviorSubject<any>(this.get(key));
      this.storageSubjects.set(key, subject);
    }
    return this.storageSubjects.get(key)!.asObservable();
  }

  delete(key: string): void {
    this.storage.delete(key);
    if (this.storageSubjects.has(key)) {
      this.storageSubjects.get(key)?.next(null);
    }
  }

  clear(): void {
    this.storage.clear();
    this.storageSubjects.forEach((subject) => subject.next(null));
  }

  // Collection helpers
  addToCollection(collectionKey: string, item: any): void {
    const collection = this.get(collectionKey) || [];
    collection.push(item);
    this.set(collectionKey, collection);
    console.log(`Added to ${collectionKey}, new length:`, collection.length);
  }

  updateInCollection(collectionKey: string, id: string, updatedItem: any): void {
    const collection = this.get(collectionKey) || [];
    const index = collection.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      collection[index] = { ...collection[index], ...updatedItem };
      this.set(collectionKey, collection);
      console.log(`Updated in ${collectionKey}, id:`, id);
    }
  }

  removeFromCollection(collectionKey: string, id: string): void {
    let collection = this.get(collectionKey) || [];
    collection = collection.filter((item: any) => item.id !== id);
    this.set(collectionKey, collection);
    console.log(`Removed from ${collectionKey}, id:`, id);
  }

  findInCollection(collectionKey: string, predicate: (item: any) => boolean): any {
    const collection = this.get(collectionKey) || [];
    return collection.find(predicate);
  }

  filterCollection(collectionKey: string, predicate: (item: any) => boolean): any[] {
    const collection = this.get(collectionKey) || [];
    return collection.filter(predicate);
  }
}
