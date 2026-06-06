const CampusLocation = require("../models/CampusLocation");

exports.getLocations = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    const locations = await CampusLocation.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, locations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const loc = await CampusLocation.create(req.body);
    res.status(201).json({ success: true, location: loc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const loc = await CampusLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!loc) return res.status(404).json({ success: false, message: "Location not found" });
    res.json({ success: true, location: loc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.seedLocations = async (req, res) => {
  try {
    const existing = await CampusLocation.countDocuments();
    if (existing > 0) return res.json({ success: true, message: "Already seeded" });

    const locations = [
      { name: "Technology Tower", code: "TT", category: "academic", description: "Main academic block with lecture halls and faculty offices", gridX: 3, gridY: 2, capacity: 2000, facilities: ["Wi-Fi", "AC", "Projectors"], timings: "8:00 AM – 8:00 PM" },
      { name: "Silver Jubilee Tower", code: "SJT", category: "academic", description: "Engineering and science departments", gridX: 5, gridY: 2, capacity: 3000, facilities: ["Wi-Fi", "Labs", "Seminar Halls"], timings: "8:00 AM – 8:00 PM" },
      { name: "Computational Laboratory", code: "CL", category: "lab", description: "Computer labs with high-speed internet", gridX: 4, gridY: 3, capacity: 500, facilities: ["300 PCs", "24hr Access", "Wi-Fi"], timings: "24 Hours" },
      { name: "Main Library", code: "LIB", category: "academic", description: "Central library with digital resources", gridX: 6, gridY: 2, capacity: 800, facilities: ["80,000+ Books", "Digital Library", "Study Rooms"], timings: "8:00 AM – 10:00 PM" },
      { name: "Men's Hostel Block A", code: "MBA", category: "hostel", description: "On-campus residential block for male students", gridX: 1, gridY: 5, capacity: 400, facilities: ["Wi-Fi", "Gym", "Laundry"], timings: "24 Hours" },
      { name: "Women's Hostel Block", code: "WHB", category: "hostel", description: "On-campus residential block for female students", gridX: 2, gridY: 5, capacity: 400, facilities: ["Wi-Fi", "Mess", "Security"], timings: "24 Hours" },
      { name: "Admin Block", code: "AB", category: "admin", description: "Admissions, registrar, and administrative offices", gridX: 7, gridY: 1, capacity: 100, facilities: ["Exam Cell", "Finance Office", "Student Affairs"], timings: "9:00 AM – 5:00 PM" },
      { name: "Student Amenity Centre", code: "SAC", category: "food", description: "Food court, shops, and student services", gridX: 4, gridY: 5, capacity: 600, facilities: ["Food Court", "ATM", "Stationery", "Salon"], timings: "7:00 AM – 11:00 PM" },
      { name: "Health Centre", code: "HC", category: "medical", description: "24/7 medical facility on campus", gridX: 8, gridY: 3, capacity: 50, facilities: ["Doctor", "Pharmacy", "Ambulance"], timings: "24 Hours" },
      { name: "Sports Complex", code: "SC", category: "sports", description: "Indoor and outdoor sports facilities", gridX: 2, gridY: 7, capacity: 1000, facilities: ["Cricket", "Basketball", "Swimming Pool", "Gym"], timings: "6:00 AM – 9:00 PM" },
      { name: "Mechanical Block", code: "MB", category: "lab", description: "Mechanical and civil engineering workshops", gridX: 6, gridY: 4, capacity: 300, facilities: ["Workshop", "CNC Machines", "3D Printers"], timings: "8:00 AM – 6:00 PM" },
      { name: "Banking & Finance Block", code: "BFB", category: "academic", description: "Business school and finance department", gridX: 8, gridY: 2, capacity: 500, facilities: ["Trading Lab", "Seminar Hall", "Wi-Fi"], timings: "8:00 AM – 7:00 PM" },
    ];

    await CampusLocation.insertMany(locations);
    res.json({ success: true, message: `Seeded ${locations.length} locations` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
