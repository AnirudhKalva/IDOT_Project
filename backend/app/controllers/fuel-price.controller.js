const Fuel = require('../models/fuel.model');

exports.getAllFuelMetadata = async (req, res) => {
  try {
    const fuelData = await Fuel.find({});
    const counties = [...new Set(fuelData.map(entry => entry.County))];
    const quarters = [...new Set(fuelData.map(entry => entry.Quarter))];

    res.status(200).json({ counties, quarters });
  } catch (err) {
    console.error('Error fetching fuel metadata:', err);
    res.status(500).json({ message: 'Failed to fetch fuel metadata' });
  }
};

exports.getFuelPrice = async (req, res) => {
    try {
      const { county, quarter, fuelType } = req.query;
  
      const fuel = await Fuel.findOne({
        County: county,
        Quarter: quarter,
        "Fuel Type": fuelType // <-- Important: use exact field name with space
      });
      console.log('Looking for fuel with:', {
        County: county,
        Quarter: quarter,
        'Fuel Type': fuelType
      });
      
      if (!fuel) {
        return res.status(404).json({ message: 'Fuel price not found' });
      }
  
      res.status(200).json({ fuelPrice: fuel["Fuel Price"] }); // <-- read with exact key
    } catch (err) {
      console.error('Error fetching fuel price:', err);
      res.status(500).json({ message: 'Failed to fetch fuel price' });
    }
  };
  
  exports.updateFuelPrice = async (req, res) => {
    const { county, quarter, prices } = req.body;
  
    if (!county || !quarter || !prices) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
  
    try {
      for (const [fuelType, price] of Object.entries(prices)) {
        await Fuel.findOneAndUpdate(
          { County: county, Quarter: quarter, 'Fuel Type': fuelType },
          { $set: { 'Fuel Price': price } },
          { new: true, upsert: true }
        );
      }
  
      res.status(200).json({ message: 'Fuel prices updated successfully' });
    } catch (err) {
      console.error('Error updating fuel prices:', err);
      res.status(500).json({ message: 'Failed to update fuel prices' });
    }
  };




  exports.bulkUploadFuelPrices = async (req, res) => {
    const fuelDataArray = req.body;
  
    if (!Array.isArray(fuelDataArray)) {
      return res.status(400).json({ message: 'Invalid data format. Expected an array.' });
    }
  
    try {
      const bulkOps = [];
  
      for (const record of fuelDataArray) {
        const county = record.County;
        const quarter = record.Quarter;
        const fuelType = record['Fuel Type'];
        let fuelPrice = record['Fuel Price'];
  
        if (!county || !quarter || !fuelType) {
          console.warn('Skipping record due to missing fields:', record);
          continue;
        }
  
        fuelPrice = parseFloat(fuelPrice);
        if (isNaN(fuelPrice)) {
          console.warn(`Fuel Price invalid or missing for County=${county}, Quarter=${quarter}, FuelType=${fuelType}. Setting to 0.`);
          fuelPrice = 0;
        }
  
        bulkOps.push({
          updateOne: {
            filter: { County: county, Quarter: quarter, 'Fuel Type': fuelType },
            update: { $set: { 'Fuel Price': fuelPrice } },
            upsert: true
          }
        });
      }
  
      if (bulkOps.length > 0) {
        await Fuel.bulkWrite(bulkOps); // <-- One shot bulk update!
      }
  
      res.status(200).json({ message: 'Bulk fuel prices uploaded successfully.' });
  
    } catch (error) {
      console.error('Error in bulk upload:', error);
      res.status(500).json({ message: 'Failed to bulk upload fuel prices.' });
    }
  };
  

  
  