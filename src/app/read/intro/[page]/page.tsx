import GatedSectionPage from '@/components/reading/GatedSectionPage'
import { introData } from '@/data/introData'

export default function IntroPage() {
    return <GatedSectionPage sectionId="intro" pages={introData} />
}
