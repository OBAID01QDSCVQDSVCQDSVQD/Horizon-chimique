# Catalogue Viewer Setup Guide

## 📖 Catalogue Viewer Features

The catalogue viewer page (`/catalogue-viewer`) provides a beautiful book-like interface to display your 32-page catalogue with the following features:

### ✨ Key Features
- **Book-like Navigation**: Previous/Next page buttons with smooth transitions
- **Zoom Controls**: Zoom in/out (50% to 300%) with reset functionality
- **Fullscreen Mode**: Immersive viewing experience
- **Keyboard Navigation**: 
  - Arrow keys (← →) for navigation
  - Spacebar for next page
  - Home/End for first/last page
  - Escape to exit fullscreen
- **Thumbnail Sidebar**: Quick navigation to any page (desktop)
- **Mobile Responsive**: Optimized for mobile devices
- **Page Download**: Download individual pages as images
- **Loading States**: Smooth loading with progress indicators

### 🖼️ Image Setup

To use the catalogue viewer, you need to place your 32 page images in the following location:

```
public/images/catalogue/
├── 1.jpg
├── 2.jpg
├── 3.jpg
...
├── 31.jpg
└── 32.jpg
```

### 📋 Image Requirements
- **Format**: JPG, PNG, or WebP
- **Naming**: Must follow the pattern `X.jpg` where X is a number from 1 to 32
- **Size**: Recommended minimum 800x600px for good quality
- **Aspect Ratio**: 3:4 or 4:3 works best for book-like viewing

### 🚀 How to Access

1. **From Admin Panel**: Click the "📖 Voir le Catalogue" button in the catalogues admin page
2. **Direct URL**: Navigate to `http://localhost:3000/catalogue-viewer`
3. **New Tab**: The viewer opens in a new tab for better experience

### 🎨 Customization

You can customize the viewer by modifying:
- **Page count**: Change the `length: 32` in the pages array
- **Image path**: Modify the `imageUrl` pattern
- **Styling**: Update CSS classes for different themes
- **Controls**: Add/remove navigation features

### 📱 Mobile Experience

- Swipe gestures for navigation (can be added)
- Responsive thumbnail grid
- Touch-friendly controls
- Optimized for mobile browsers

### 🔧 Technical Details

- **Framework**: Next.js 15 with React
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React hooks
- **Performance**: Image preloading for smooth navigation

### 🎯 Usage Tips

1. **Best Experience**: Use fullscreen mode for immersive viewing
2. **Quick Navigation**: Use the thumbnail sidebar on desktop
3. **Keyboard Shortcuts**: Learn the keyboard shortcuts for faster navigation
4. **Download**: Use the download button to save specific pages
5. **Zoom**: Use zoom controls for detailed viewing of small text

---

**Note**: Make sure all 32 images are properly named and placed in the correct directory before using the viewer. 