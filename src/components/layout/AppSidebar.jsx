import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  CCloseButton,
  CHeaderNav,
  CImage,
  CSidebar,
  CSidebarBrand,
  CSidebarNav,
} from '@coreui/react'
import { AppSidebarNav } from 'src/components/layout'
import SimpleBar from 'simplebar-react'
import 'simplebar/dist/simplebar.min.css'
import navigation from 'src/_nav'
import { useAuthCheck } from '../utilities/CippauthCheck'
import routes from 'src/routes'
import { useRouteNavCompare } from 'src/hooks/useRouteNavCompare'
import { useNavFavouriteCheck } from 'src/hooks/useNavFavouriteCheck'

import CIPPImage from 'src/assets/images/CIPP.png'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.app.sidebarShow)

  const newNav = useRouteNavCompare(navigation)
  const navwithFavourites = useNavFavouriteCheck(newNav)

  return (
    <CSidebar
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
      position="fixed"
      unfoldable={false}
      visible={sidebarShow}
    >
      <CSidebarBrand className="me-auto pt-xs-2 p-md-2" to="/">
        <CImage className="sidebar-brand-full mt-3" src={CIPPImage} height={116} width={170} />
        <CHeaderNav className="me-2 p-2"></CHeaderNav>
      </CSidebarBrand>
      <CCloseButton
        className="d-lg-none"
        onClick={() => dispatch({ type: 'set', sidebarShow: false })}
      />
      <CSidebarNav>
        <SimpleBar>
          <AppSidebarNav items={navwithFavourites} />
        </SimpleBar>
      </CSidebarNav>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
