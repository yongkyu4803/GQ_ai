# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Korean-language educational web platform for generative AI learning (GQ_AI). It's a Node.js/Express web application that provides structured lectures on AI concepts, prompt engineering, and practical AI implementation.

## Development Commands

- **Start development server**: `npm run dev` (uses nodemon for auto-restart)
- **Start production server**: `npm start` (runs server.js directly)
- **Install dependencies**: `npm install`

## Architecture

### Core Application Structure
- **app.js**: Main Express application configuration with routes and middleware
- **server.js**: Server entry point that starts the application on specified port
- **lectures.json**: Centralized data store containing all lecture information and structure

### Route System
The application uses a dynamic route generation system:
- Routes for lectures 01-13 are generated programmatically in app.js:60-74
- Each lecture route (`/lecture01`, `/lecture02`, etc.) maps to corresponding EJS template
- Lecture data is retrieved from lectures.json and passed to templates

### Template Architecture
- **Base Layout**: Uses express-ejs-layouts with `base.ejs` as the main layout
- **Views Directory**: Contains individual lecture templates (lecture01.ejs through lecture13.ejs)
- **Shared Components**: navbar.ejs for navigation, layout.ejs for structure
- **Global Data**: lectures.json data is made available to all views via middleware (app.js:32-36)

### Static Assets
- **CSS**: Located in public/css/ (index.css, styles.css)
- **Images**: Extensive image collection in public/images/ including lecture screenshots and educational materials
- **PPT Samples**: HTML presentations in public/images/ppt_sample/

### Security Configuration
The application implements Content Security Policy (CSP) headers (app.js:9-22) to allow:
- External CDN resources (jsdelivr, cdnjs, Google Fonts)
- Vercel deployment domains
- Inline scripts and styles for dynamic content

### Key Features
- **Lecture Management**: 13 structured lectures covering AI basics to advanced implementation
- **MyGPTs Integration**: Dedicated section for GPT customization examples
- **Q&A System**: Built-in Q&A page for common questions
- **Error Handling**: Custom 404 page with proper navigation
- **Korean Language Support**: Full Korean language interface and content

## Data Structure

The lectures.json file contains hierarchical lecture data with:
- Lecture metadata (number, title, description, link)
- Main topics with subtopics for each lecture
- Structured content organization for consistent rendering

## Quiz System

### Interactive Assessment Platform
- **Quiz Route**: `/quiz` provides AI knowledge assessment
- **Technology Stack**: React (CDN) + Tailwind CSS integrated with existing EJS templates
- **Content**: 20 questions total (10 beginner + 10 intermediate level)
- **Features**: Progress tracking, scoring system, detailed results, level progression

### Quiz Data Structure
- **Beginner Level**: Basic AI concepts (Generative AI, prompts, multimodal AI, limitations)
- **Intermediate Level**: Advanced techniques (prompt engineering, RAG, business integration)
- **Scoring**: 90%+ (우수), 70%+ (양호), 50%+ (보통), <50% (부족)
- **Navigation**: Level selection, question progression, result analysis

### Technical Implementation
- **React Integration**: CDN-based React components within EJS templates
- **CSS Compatibility**: Bootstrap/Tailwind isolation via quiz-compatibility.css
- **Icons**: Lucide React for modern UI components
- **Responsive Design**: Mobile-friendly interface with progressive enhancement

## Deployment Configuration

- **Vercel**: Configured with vercel.json for serverless deployment
- **Netlify**: Has netlify.toml configuration
- **Node.js Version**: Requires Node.js >=14.0.0 (specified in package.json engines)