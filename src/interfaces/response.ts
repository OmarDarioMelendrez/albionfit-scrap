import { S3ObjectKey } from '../entities/product'
import IOutputProduct from './outputProduct'
import IReport from './report'

export default interface IScrapeResponse {
  /**
   * @description Request's page URL
   */
  pageUrl: string

  /**
   * @description Each extractor's result
   */
  extractorResults: IReport<IOutputProduct | S3ObjectKey>[]
}
