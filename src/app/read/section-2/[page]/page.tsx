import GatedSectionPage from '@/components/reading/GatedSectionPage'
import { unit2Data } from '@/data/bookData'

export default function Section2Page() {
    return <GatedSectionPage sectionId="section-2" pages={unit2Data} />
}
