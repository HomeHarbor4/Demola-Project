import { Router, Request, Response } from 'express';
import { ouluDataService } from '../services/ouluDataService';
import { log } from '../vite';

const router = Router();

/**
 * @route GET /api/oulu/datasets
 * @desc Get list of available datasets from Oulu Open Data
 */
router.get('/datasets', async (req: Request, res: Response) => {
  log(`[REQUEST] GET /api/oulu/datasets`, 'oulu-api');
  try {
    const datasets = await ouluDataService.getDatasetList();
    log(`[RESPONSE] 200 /api/oulu/datasets - ${datasets.length} datasets`, 'oulu-api');
    res.json(datasets);
  } catch (error) {
    log(`[ERROR] /api/oulu/datasets - ${error}`, 'oulu-api');
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

/**
 * @route GET /api/oulu/datasets/:id
 * @desc Get detailed information about a specific dataset
 */
router.get('/datasets/:id', async (req: Request, res: Response) => {
  log(`[REQUEST] GET /api/oulu/datasets/${req.params.id}`, 'oulu-api');
  try {
    const { id } = req.params;
    const datasetInfo = await ouluDataService.getDatasetInfo(id);
    log(`[RESPONSE] 200 /api/oulu/datasets/${id} - dataset found`, 'oulu-api');
    res.json(datasetInfo);
  } catch (error) {
    log(`[ERROR] /api/oulu/datasets/${req.params.id} - ${error}`, 'oulu-api');
    res.status(500).json({ error: 'Failed to fetch dataset information' });
  }
});

/**
 * @route GET /api/oulu/search
 * @desc Search for datasets matching a query
 */
router.get('/search', async (req: Request, res: Response) => {
  log(`[REQUEST] GET /api/oulu/search q=${req.query.q} limit=${req.query.limit}`, 'oulu-api');
  try {
    const { q, limit } = req.query;
    if (!q || typeof q !== 'string') {
      log(`[CONDITION] /api/oulu/search missing or invalid q`, 'oulu-api');
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    const limitNum = limit ? parseInt(limit as string) : 10;
    const searchResults = await ouluDataService.searchDatasets(q, limitNum);
    log(`[RESPONSE] 200 /api/oulu/search - ${searchResults.count} results`, 'oulu-api');
    res.json(searchResults);
  } catch (error) {
    log(`[ERROR] /api/oulu/search - ${error}`, 'oulu-api');
    res.status(500).json({ error: 'Failed to search datasets' });
  }
});

/**
 * @route GET /api/oulu/resources/:id
 * @desc Get data from a specific resource
 */
router.get('/resources/:id', async (req: Request, res: Response) => {
  log(`[REQUEST] GET /api/oulu/resources/${req.params.id} limit=${req.query.limit} offset=${req.query.offset}`,'oulu-api');
  try {
    const { id } = req.params;
    const { limit, offset, ...filters } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 100;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    const filterObj: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      filterObj[key] = value;
    });
    const resourceData = await ouluDataService.getResourceData(id, limitNum, offsetNum, filterObj);
    log(`[RESPONSE] 200 /api/oulu/resources/${id} - ${resourceData.records.length} records`, 'oulu-api');
    res.json(resourceData);
  } catch (error) {
    log(`[ERROR] /api/oulu/resources/${req.params.id} - ${error}`, 'oulu-api');
    res.status(500).json({ error: 'Failed to fetch resource data' });
  }
});

/**
 * @route GET /api/oulu/property-prices
 * @desc Get property price data for Oulu region
 */
router.get('/property-prices', async (req: Request, res: Response) => {
  log(`[REQUEST] GET /api/oulu/property-prices limit=${req.query.limit}`, 'oulu-api');
  try {
    const { limit, ...filters } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 50;
    const filterObj: Record<string, any> = {};
    Object.entries(filters).forEach(([key, value]) => {
      filterObj[key] = value;
    });
    const propertyData = await ouluDataService.getPropertyPriceData(limitNum, filterObj);
    log(`[RESPONSE] 200 /api/oulu/property-prices - ${propertyData.records.length} records`, 'oulu-api');
    res.json(propertyData);
  } catch (error) {
    log(`[ERROR] /api/oulu/property-prices - ${error}`, 'oulu-api');
    res.status(500).json({ error: 'Failed to fetch property price data' });
  }
});

/**
 * @route GET /api/oulu/pois/:type
 * @desc Get points of interest data by type
 */
router.get('/pois/:type', async (req: Request, res: Response) => {
  log(`[REQUEST] GET /api/oulu/pois/${req.params.type} limit=${req.query.limit}`, 'oulu-api');
  try {
    const { type } = req.params;
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 100;
    const poiData = await ouluDataService.getPointsOfInterest(type, limitNum);
    log(`[RESPONSE] 200 /api/oulu/pois/${type} - ${poiData.records.length} records`, 'oulu-api');
    res.json(poiData);
  } catch (error) {
    log(`[ERROR] /api/oulu/pois/${req.params.type} - ${error}`, 'oulu-api');
    res.status(500).json({ error: 'Failed to fetch points of interest data' });
  }
});

export default router;