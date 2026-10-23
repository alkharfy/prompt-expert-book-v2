import GatedSectionPage from '@/components/reading/GatedSectionPage'
import { unit1Data } from '@/data/bookData'

export default function Section1Page() {
    return <GatedSectionPage sectionId="section-1" pages={unit1Data} />
}
