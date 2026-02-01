# User Manual - RSIP Application Gallery

## Welcome

The RSIP Application Gallery is a collection of real-world robotics applications to help you understand what features and configurations are needed for different robotic scenarios. Browse examples organized by application type, environment, and tasks to find inspiration for your own robot configuration.

---

## 1. Getting Started

### Accessing the Gallery

Open your web browser and navigate to the Application Gallery URL:
- **Development:** http://localhost:5174/
- **Production:** (Your deployment URL)

### Understanding the Interface

The gallery homepage displays:
- **Category Cards** - Three main application categories with item counts
- **Search Bar** - Find content by keyword
- **Content Grid** - Thumbnails of robotics applications
- **Filter Tags** - Active filters showing your current selection

---

## 2. Application Categories

Content is organized into three main categories based on what robots DO:

### Industrial Automation
Factory, warehouse, and manufacturing applications including:
- Material transportation and logistics
- Quality inspection and monitoring
- Part manipulation and assembly
- Palletizing and packaging
- Welding and fabrication

**Example scenarios:** Warehouse robots moving pallets, robotic arms assembling products, automated inspection systems.

### Service Robotics
Customer-facing and assistance applications including:
- Delivery services (food, packages, room service)
- Human interaction and guidance
- Healthcare assistance
- Cleaning and maintenance

**Example scenarios:** Hotel delivery robots, hospital logistics robots, retail assistance robots.

### Surveillance & Security
Monitoring and security applications including:
- Perimeter patrol
- Threat detection
- Access monitoring
- Facility surveillance

**Example scenarios:** Security patrol robots, autonomous monitoring drones.

---

## 3. Browsing Content

### Using Category Cards

1. Click on any category card (Industrial, Service, Security)
2. The gallery filters to show only items in that category
3. The active filter appears as a tag below the search bar

### Using Search

1. Enter keywords in the search bar
2. Press Enter or click the search icon
3. Results show items matching your keywords in title or description

**Search tips:**
- Use specific terms: "warehouse forklift" instead of "robot"
- Combine terms: "hospital delivery"
- Try different variations: "AGV" vs "automated guided vehicle"

### Filtering by Scene

Click on scene tags to filter by environment:
- **Warehouse** - Distribution centers, logistics hubs
- **Manufacturing** - Production floors, assembly lines
- **Retail** - Stores, shopping centers
- **Hospital** - Healthcare facilities, clinics
- **Office** - Corporate buildings, workspaces
- **Hotel** - Hospitality venues, resorts
- **Outdoor** - External environments, campuses
- **Laboratory** - Research facilities, clean rooms

### Combining Filters

You can combine multiple filters:
1. Select a category (e.g., Industrial Automation)
2. Add a scene filter (e.g., Warehouse)
3. Results show items matching ALL active filters

### Clearing Filters

- Click the "×" on any filter tag to remove it
- Click "Clear All" to reset all filters

---

## 4. Viewing Content Details

### Opening the Detail View

Click on any content card to open the detail modal showing:
- **Video Player** or **Image** - Full-size media
- **Title & Source** - Content origin and publication date
- **Description** - Full text from original source
- **AI Summary** - Key points about the application
- **Application Details** - Category, tasks, requirements

### Understanding Application Details

The right sidebar shows RSIP-relevant information:

**Category**
The main application type (Industrial, Service, Security)

**Scene Type**
The environment where the robot operates

**Tasks Performed**
Specific activities the robot handles:
- Transportation, Inspection, Manipulation
- Delivery, Human Interaction, Cleaning
- Patrol, Threat Detection, Monitoring

**Functional Requirements**
Technical capabilities needed:
- Autonomous navigation
- Object detection
- Human-robot interaction
- And many more aligned with RSIP platform

### Viewing Related Content

Scroll down in the detail modal to see:
- **Related Items** - Similar applications based on category and tasks
- Click any related item to view its details

---

## 5. Deep Linking

### Sharing Filtered Views

Copy the URL from your browser to share a specific filtered view:

```
/browse?category=industrial_automation
/browse?scene=warehouse
/browse?category=service_robotics&tasks=delivery_service
/browse?search=welding+robot
```

### RSIP Platform Integration

When accessing from RSIP platform, the gallery may open with pre-selected filters based on your current configuration context.

---

## 6. Suggesting Content

### Submitting a Suggestion

If you find a great robotics application not in the gallery:

1. Click "Suggest Content" button
2. Enter the content URL
3. Add a title (optional)
4. Select a category you think fits best
5. Add any notes for administrators
6. Click "Submit"

### Suggestion Guidelines

**Good suggestions:**
- Real-world robotics applications
- High-quality video or images
- Clear demonstration of robot capabilities
- Relevant to RSIP platform use cases

**Not suitable:**
- Product advertisements without application context
- Concept videos or CGI renders
- Unrelated industrial equipment
- Poor quality or duplicate content

---

## 7. Content Types

### Videos
Most content is video from:
- Company official channels
- Industry news outlets
- Trade show demonstrations

### Articles
News and case studies from:
- Industry publications
- Company press releases
- Technical blogs

### Images
Photos and diagrams showing:
- Robot installations
- Application environments
- System configurations

---

## 8. Tips for Finding Relevant Content

### When Configuring Your Robot

1. **Start with your scene type** - Filter by the environment most similar to yours
2. **Browse related tasks** - Look at items performing tasks you need
3. **Note the requirements** - Check what functional requirements are listed

### When Exploring New Applications

1. **Browse featured content** - Highlighted items are high-quality examples
2. **Try different categories** - See what's possible across domains
3. **Use search creatively** - Try industry terms, brand names, or specific tasks

### Understanding What You Need

As you browse, pay attention to:
- What sensors the robots use
- How they navigate the environment
- How they interact with humans
- What safety features are visible

This information helps you configure RSIP for your specific needs.

---

## 9. Frequently Asked Questions

**Q: How often is new content added?**
A: The crawler runs daily to find new content from configured sources.

**Q: Can I download videos from the gallery?**
A: No, content is embedded from original sources. Visit the source link to access the original content.

**Q: Why don't I see some content I expected?**
A: Content must be approved by administrators before public display. Some content may be pending review.

**Q: How accurate is the AI classification?**
A: Classifications are generated automatically and reviewed by administrators. If you notice errors, use the feedback option.

**Q: Can I filter by specific robot brands?**
A: The gallery is organized by application type, not robot brand. Use search to find specific manufacturers.

**Q: How do I report inappropriate content?**
A: Use the "Report" option in the content detail view, or contact the RSIP team.

---

## 10. Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close detail modal |
| `/` | Focus search bar |
| `←` `→` | Navigate between items (in modal) |

---

## 11. Browser Support

The gallery works best on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Mobile browsers are supported with responsive layout.

---

## Need Help?

For questions or support:
- Contact the RSIP Development Team
- Report issues at the project repository

---

*RSIP Application Gallery - Helping you understand real-world robotics applications*
