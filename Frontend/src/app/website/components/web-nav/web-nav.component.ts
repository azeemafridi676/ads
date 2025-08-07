import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { gsap } from 'gsap';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-web-nav',
  templateUrl: './web-nav.component.html',
  styleUrls: ['./web-nav.component.scss']
})
export class WebNavComponent implements AfterViewInit , OnInit {

  @ViewChildren('faqButton') faqButtons!: QueryList<ElementRef>;
  @ViewChildren('faqContent') faqContents!: QueryList<ElementRef>;
  @ViewChildren('faqArrow') faqArrows!: QueryList<ElementRef>;
  userData:any;
  constructor(private authService: AuthService,private router: Router) {}
  ngOnInit(): void {
    this.authService.getUserProfileData().subscribe((data)=>{
      this.userData = data;
    });
  }
  
  ngAfterViewInit(): void {
    this.initializeMenu();
    this.animateNav();
  }
  initializeMenu(): void {
    const menuTimeline = gsap.timeline({ paused: true });

    // Slide in menu panel
    menuTimeline.from("#full", {
      x: "100%",
      duration: 0.6,
      ease: "power2.out"
    });

    // Stagger menu items
    menuTimeline.from("#full a", {
      x: 150,
      duration: 0.6, 
      stagger: 0.28,
      opacity: 0,
      ease: "back.out"
    });

    // Animate close button
    menuTimeline.from("#close", {
      opacity: 0,
      x: 60,
      duration: 0.5,
      scale: 0.5,
      ease: "back.out(1.7)"
    });

    // Menu toggle handlers
    const toggleButton = document.querySelector("#toggle");
    const closeButton = document.querySelector("#close");

    toggleButton?.addEventListener("click", () => {
      menuTimeline.play();
    });

    closeButton?.addEventListener("click", () => {
      menuTimeline.reverse();
    });
  }
  navigateToDashboard(){
    let routeToHit='/dashboard'
    if(this.userData.role.includes('admin')){
      routeToHit='/dashboard/admin'
    }
    this.router.navigate([routeToHit]);
  }
  animateNav(): void {
    gsap.to(".mainNav", {
      y: 0,
      duration: 1,
      ease: "power4.out",
      delay: 0.5
    });
  }
}
