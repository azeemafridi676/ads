import { Component, OnInit, AfterViewInit, ElementRef, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { gsap } from 'gsap';
import { HomeService, Stats } from '../../shared/service/home/home.service';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements AfterViewInit, OnInit {
  stats: Stats[] = [];

  constructor(private homeService: HomeService) {
    this.stats = this.homeService.getStats();
  }

  ngOnInit() {
    // No longer loading reviews
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeVideoHover(); 
      this.initializeFAQAccordion();
      this.initializeScrollAnimations();
      this.initializeHeroAnimations(); 
    }, 10);
  }
  
  initializeVideoHover(): void {
    const videoContainer = document.getElementById('videoContainer');
    const banner = document.getElementById('banner');
    const video = document.getElementById('video') as HTMLVideoElement;
    let hasBeenHovered = false;
    if (videoContainer && banner && video) {
      videoContainer.addEventListener('mouseenter', () => {
        if (!hasBeenHovered) {
          gsap.to(banner, {
            opacity: 0,
            duration: 0.3
          });
          video.play();
          hasBeenHovered = true;
        } else {
          video.play();
        }
      });
      videoContainer.addEventListener('mouseleave', () => {
        video.pause();
      });
    }
  }
  
  initializeFAQAccordion(): void {
    const faqButtons = document.querySelectorAll('.faq-btn');
    faqButtons.forEach(button => {
      button.addEventListener('click', () => {
        const content:any = button.nextElementSibling;
        const contentInner = content.children[0];
        const arrow = button.querySelector('svg');
        if (content.style.maxHeight) {
          gsap.to(arrow, {
            rotation: 0,
            duration: 0.3
          });
          content.style.maxHeight = null;
        } else {
          faqButtons.forEach(otherButton => {
            if (otherButton !== button) {
              const otherContent:any = otherButton.nextElementSibling;
              const otherArrow = otherButton.querySelector('svg');
              gsap.to(otherArrow, {
                rotation: 0,
                duration: 0.3
              });
              otherContent.style.maxHeight = null;
            }
          });
          gsap.to(arrow, {
            rotation: 180,
            duration: 0.3
          });
          content.style.maxHeight = contentInner.offsetHeight + "px";
        }
      });
    });
  }
  
  initializeScrollAnimations(): void {
    gsap.fromTo("#newsletter-truck", 
      { x: "100%" ,
        opacity:0
      },
      {
        scrollTrigger: {
          trigger: "#newsletter-truck",
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
        opacity:1,
        x: "-40%",  
        ease: "power2.inOut"
      }
    );
    gsap.from("#brands-title", {
      scrollTrigger: {
        trigger: "#brands-title",
        start: "top bottom",
        end: "top center",
        toggleActions: "play none none reverse"
      },
      y: 100,
      opacity: 0,
      duration: 1,
      ease: "elastic.out(1, 0.3)"
    });
    gsap.from("#brands-list", {
      scrollTrigger: {
        trigger: "#brands-list",
        start: "top bottom", 
        end: "top center",
        toggleActions: "play none none reverse"
      },
      y: 100,
      opacity: 0,
      duration: 1,
      delay: 0.2,
      ease: "elastic.out(1, 0.3)"
    });
    gsap.to("#brands-title", {
      scrollTrigger: {
        trigger: "#brands-title",
        start: "top center",
        end: "bottom top",
        scrub: 1
      },
      x: 200,
      duration: 1,
      ease: "none"
    });
    gsap.to("#brands-list", {
      scrollTrigger: {
        trigger: "#brands-list",
        start: "top center",
        end: "bottom top",
        scrub: 1
      },
      x: -200,
      duration: 1,
      ease: "none"
    });
    const featureBoxes = document.querySelectorAll('.feature-box');
    featureBoxes.forEach((box, index) => {
      gsap.from(box, {
        scrollTrigger: {
          trigger: box,
          start: "top bottom-=100",
          end: "top center",
          toggleActions: "play none none reverse"
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: index * 0.2,
        ease: "power2.out"
      });
    });
  }
  
  initializeHeroAnimations(): void {
    const heroTimeline = gsap.timeline({
      defaults: { 
        ease: "power4.out",
        duration: 1.5
      }
    });
    gsap.set("#heroSpinner", { opacity: 0, scale: 0.5 });
    gsap.set("#heroVan", { x: "-100vw" });
    gsap.set("#videoContainer", { scale: 0, opacity: 0 });
    heroTimeline.to("#heroSpinner", {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: "elastic.out(1, 0.5)"
    })
    .to("#heroVan", {
      x: 0,
      duration: 1.2,
      ease: "power4.out"
    }, "-=0.5")
    .to("#videoContainer", {
      scale: 1,
      opacity: 1,
      duration: 1,
      ease: "back.out(1.7)"
    }, "-=0.7");
    gsap.utils.toArray(["#heroVan", "#videoContainer"]).forEach((element: any) => {
      element.addEventListener("mouseenter", () => {
        gsap.to(element, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out"
        });
      });
      element.addEventListener("mouseleave", () => {
        gsap.to(element, {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        });
      });
    });
  }
}
